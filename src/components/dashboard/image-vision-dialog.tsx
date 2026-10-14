'use client'

import * as React from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  FileCode2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  PlusCircle,
  Receipt,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { newId } from '@/lib/id'
import { formatMoney } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface DetectedItem {
  name: string
  quantity: number
  unitPricePaise: number
  totalPaise: number
}

interface EditableDetectedItem extends DetectedItem {
  id: string
}

interface VisionApiResponse {
  ok: boolean
  model?: string
  fallbackUsed?: boolean
  durationMs?: number
  rawText?: string
  vendor?: string
  date?: string
  invoiceNumber?: string
  subtotalPaise?: number
  cgstPaise?: number
  sgstPaise?: number
  taxPaise?: number
  grandTotalPaise?: number
  detectedItems?: DetectedItem[]
  description?: string
  error?: {
    code: string
    message: string
  }
}

const AVAILABLE_MODELS = [
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    badge: 'Fast & High Accuracy (~1s)',
    isRecommended: true,
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'Google DiffusionGemma 26B',
    badge: 'Deep OCR & Analysis',
    isRecommended: false,
  },
  {
    id: 'nvidia/nemotron-parse-2.0',
    name: 'Nemotron Parse 2.0',
    badge: 'OCR Specialist (~250ms)',
    isRecommended: false,
  },
]

const PRESET_PROMPTS = [
  {
    id: 'detailed',
    label: 'Exact Text & Item Breakdown',
    prompt:
      'Transcribe every line of text from the receipt exactly as printed (Exact Raw Text First). Then extract all purchased products with exact Name, Quantity, Unit Price, and Total Amount, plus subtotal, taxes, and grand total.',
  },
  {
    id: 'items_only',
    label: 'Extract Items & Prices Only',
    prompt:
      'Extract every product with its Name, Quantity, Unit Price, and Total Amount. Verify mathematical consistency (quantity * unit_price = total).',
  },
  {
    id: 'quick',
    label: 'Quick Description',
    prompt:
      'Describe what is in this image in detail. Mention all visible text, numbers, and key elements.',
  },
]

export function ImageVisionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useBillStore()

  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [imageName, setImageName] = React.useState<string>('')
  const [selectedModel, setSelectedModel] = React.useState<string>('meta/llama-3.2-11b-vision-instruct')
  const [selectedPromptId, setSelectedPromptId] = React.useState<string>('detailed')
  const [customPrompt, setCustomPrompt] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [result, setResult] = React.useState<VisionApiResponse | null>(null)
  const [itemsList, setItemsList] = React.useState<EditableDetectedItem[]>([])
  const [applyTax, setApplyTax] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'products' | 'raw_text' | 'details'>('products')
  const [copiedRaw, setCopiedRaw] = React.useState(false)
  const [copiedDesc, setCopiedDesc] = React.useState(false)
  const [imported, setImported] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Timer counter during active analysis
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      setElapsedSeconds(0)
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [loading])

  // Populate editable items whenever new results arrive
  React.useEffect(() => {
    if (result?.detectedItems) {
      setItemsList(
        result.detectedItems.map((item, idx) => ({
          ...item,
          id: `item-${idx}-${Date.now()}`,
        }))
      )
      setApplyTax((result.taxPaise || 0) > 0)
      setActiveTab('products')
    } else {
      setItemsList([])
    }
  }, [result])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WEBP).')
      return
    }
    setImageName(file.name)
    setResult(null)
    setItemsList([])
    setImported(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!imageSrc) return

    setLoading(true)
    setResult(null)
    setItemsList([])
    setImported(false)

    const activePrompt =
      customPrompt.trim().length > 0
        ? customPrompt
        : PRESET_PROMPTS.find((p) => p.id === selectedPromptId)?.prompt || PRESET_PROMPTS[0].prompt

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          prompt: activePrompt,
          model: selectedModel,
        }),
      })

      const data: VisionApiResponse = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setResult({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Failed to reach vision server',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemChange = (
    id: string,
    field: 'name' | 'quantity' | 'unitPriceRupees' | 'totalRupees',
    value: string | number
  ) => {
    setItemsList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        if (field === 'name') {
          return { ...item, name: String(value) }
        }

        if (field === 'quantity') {
          const qty = Math.max(1, parseInt(String(value), 10) || 1)
          const totalPaise = Math.round(qty * item.unitPricePaise)
          return { ...item, quantity: qty, totalPaise }
        }

        if (field === 'unitPriceRupees') {
          const unitPriceRupees = parseFloat(String(value)) || 0
          const unitPricePaise = Math.round(unitPriceRupees * 100)
          const totalPaise = Math.round(item.quantity * unitPricePaise)
          return { ...item, unitPricePaise, totalPaise }
        }

        if (field === 'totalRupees') {
          const totalRupees = parseFloat(String(value)) || 0
          const totalPaise = Math.round(totalRupees * 100)
          const unitPricePaise =
            item.quantity > 0 ? Math.round(totalPaise / item.quantity) : totalPaise
          return { ...item, unitPricePaise, totalPaise }
        }

        return item
      })
    )
  }

  const handleAddItem = () => {
    setItemsList((prev) => [
      ...prev,
      {
        id: newId('item'),
        name: 'New Item',
        quantity: 1,
        unitPricePaise: 10000,
        totalPaise: 10000,
      },
    ])
  }

  const handleDeleteItem = (id: string) => {
    setItemsList((prev) => prev.filter((item) => item.id !== id))
  }

  const handleImportItems = () => {
    if (itemsList.length === 0) return

    for (const item of itemsList) {
      if (!item.name.trim()) continue
      dispatch({
        type: 'ADD_ITEM',
        item: {
          id: newId('item'),
          name: item.name.trim(),
          quantity: Math.max(1, Math.round(item.quantity)),
          unitPrice: item.unitPricePaise,
          allocation: { mode: 'equal', participantIds: [] },
        },
      })
    }

    // Optionally apply detected tax as a bill adjustment
    if (applyTax && result?.taxPaise && result.taxPaise > 0) {
      dispatch({
        type: 'ADD_ADJUSTMENT',
        adjustment: {
          id: newId('adj'),
          kind: 'tax',
          label: result.cgstPaise && result.sgstPaise ? 'GST (CGST + SGST)' : 'Receipt Tax',
          method: 'fixed',
          value: result.taxPaise,
        },
      })
    }

    setImported(true)
  }

  const handleCopyRawText = () => {
    if (!result?.rawText) return
    navigator.clipboard.writeText(result.rawText)
    setCopiedRaw(true)
    setTimeout(() => setCopiedRaw(false), 2000)
  }

  const handleCopyDescription = () => {
    if (!result?.description) return
    navigator.clipboard.writeText(result.description)
    setCopiedDesc(true)
    setTimeout(() => setCopiedDesc(false), 2000)
  }

  const resetAll = () => {
    setImageSrc(null)
    setImageName('')
    setResult(null)
    setItemsList([])
    setImported(false)
    setCustomPrompt('')
  }

  // Calculate live sum of editable items
  const computedTotalPaise = itemsList.reduce((sum, item) => sum + item.totalPaise, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold">AI Receipt Scanner & OCR Extractor</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Extracts exact receipt text verbatim first, then accurately extracts products, quantities, unit prices, and totals for any bill.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model Selector Bar */}
          <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vision Model
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                    selectedModel === m.id
                      ? 'border-primary bg-primary/10 font-semibold text-primary shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Zap className="size-3" />
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-75">({m.badge})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Area */}
          {!imageSrc ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all',
                dragOver
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                }}
              />
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <UploadCloud className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Click to upload or drag & drop bill image</p>
                <p className="text-xs text-muted-foreground">Supports PNG, JPG, JPEG, WEBP photos of any receipt or invoice</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc} alt="Uploaded receipt preview" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{imageName || 'Uploaded Receipt'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="size-3" /> Ready for OCR & product extraction
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs gap-1"
                    >
                      Change
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                      }}
                    />
                    <Button variant="ghost" size="icon" onClick={resetAll} aria-label="Remove image">
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preset Prompts */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extraction Mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPromptId(p.id)
                        setCustomPrompt('')
                      }}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                        selectedPromptId === p.id && !customPrompt
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Reading Receipt & Extracting Products ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Analyze & Extract Items
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {result && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm animate-in fade-in-50">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Receipt className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {result.vendor ? result.vendor : 'Extracted Receipt Details'}
                  </span>
                  {result.date && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      📅 {result.date}
                    </Badge>
                  )}
                  {result.invoiceNumber && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      #{result.invoiceNumber}
                    </Badge>
                  )}
                  {result.durationMs && (
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      ⚡ {(result.durationMs / 1000).toFixed(2)}s
                    </Badge>
                  )}
                  {result.model && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {result.model}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Auto-Failover Notification */}
              {result.fallbackUsed && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Primary model took too long; automatically completed via <strong>{result.model}</strong>.
                  </span>
                </div>
              )}

              {result.ok ? (
                <div className="space-y-3">
                  {/* Tab Navigation */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        activeTab === 'products'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Receipt className="size-3.5" />
                      <span>Detected Products</span>
                      <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                        {itemsList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('raw_text')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        activeTab === 'raw_text'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <FileCode2 className="size-3.5" />
                      <span>Exact Extracted Text (Raw OCR)</span>
                      {result.rawText && (
                        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                          {result.rawText.split('\n').filter((l) => l.trim().length > 0).length} lines
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        activeTab === 'details'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <FileText className="size-3.5" />
                      <span>Full AI Insights</span>
                    </button>
                  </div>

                  {/* TAB 1: DETECTED PRODUCTS (Quantity, Price & Total) */}
                  {activeTab === 'products' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Review, edit, or add products below before importing into your bill.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddItem}
                          className="h-7 text-xs gap-1 border-dashed"
                        >
                          <Plus className="size-3" /> Add Product
                        </Button>
                      </div>

                      {/* Products Interactive Table */}
                      <div className="overflow-x-auto rounded-lg border border-border bg-card">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                              <th className="py-2 px-3 text-left font-semibold">#</th>
                              <th className="py-2 px-3 text-left font-semibold">Product Name</th>
                              <th className="py-2 px-3 text-center font-semibold w-20">Qty</th>
                              <th className="py-2 px-3 text-right font-semibold w-28">Price (₹)</th>
                              <th className="py-2 px-3 text-right font-semibold w-28">Total (₹)</th>
                              <th className="py-2 px-3 text-center font-semibold w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {itemsList.map((item, index) => (
                              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                                <td className="py-2 px-3">
                                  <Input
                                    value={item.name}
                                    onChange={(e) =>
                                      handleItemChange(item.id, 'name', e.target.value)
                                    }
                                    className="h-8 text-xs font-medium"
                                    placeholder="Product description"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(item.id, 'quantity', e.target.value)
                                    }
                                    className="h-8 text-xs text-center"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={(item.unitPricePaise / 100).toFixed(2)}
                                    onChange={(e) =>
                                      handleItemChange(item.id, 'unitPriceRupees', e.target.value)
                                    }
                                    className="h-8 text-xs text-right font-mono"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={(item.totalPaise / 100).toFixed(2)}
                                    onChange={(e) =>
                                      handleItemChange(item.id, 'totalRupees', e.target.value)
                                    }
                                    className="h-8 text-xs text-right font-mono font-semibold text-primary"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="h-7 w-7 text-muted-foreground hover:text-danger"
                                    aria-label="Delete item"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {itemsList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                                  No items detected. Click &ldquo;Add Product&rdquo; to add manually.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Banner */}
                      <div className="grid gap-2 sm:grid-cols-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Items Total:</span>{' '}
                          <strong className="text-foreground">
                            {formatMoney(computedTotalPaise, 'INR')}
                          </strong>
                        </div>
                        {result.taxPaise && result.taxPaise > 0 ? (
                          <div>
                            <span className="text-muted-foreground">Detected Tax:</span>{' '}
                            <strong className="text-foreground">
                              {formatMoney(result.taxPaise, 'INR')}
                            </strong>
                            {result.cgstPaise && result.sgstPaise ? (
                              <span className="text-[10px] text-muted-foreground block">
                                (CGST: {formatMoney(result.cgstPaise, 'INR')} + SGST:{' '}
                                {formatMoney(result.sgstPaise, 'INR')})
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {result.grandTotalPaise && result.grandTotalPaise > 0 ? (
                          <div>
                            <span className="text-muted-foreground">Bill Grand Total:</span>{' '}
                            <strong className="text-primary font-bold">
                              {formatMoney(result.grandTotalPaise, 'INR')}
                            </strong>
                          </div>
                        ) : null}
                      </div>

                      {/* Tax checkbox and Import Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {result.taxPaise && result.taxPaise > 0 ? (
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                            <Checkbox
                              checked={applyTax}
                              onCheckedChange={(checked) => setApplyTax(!!checked)}
                            />
                            <span>
                              Also add detected tax (<strong>{formatMoney(result.taxPaise, 'INR')}</strong>) to Bill Adjustments
                            </span>
                          </label>
                        ) : <div />}

                        <Button
                          onClick={handleImportItems}
                          disabled={imported || itemsList.length === 0}
                          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow"
                        >
                          {imported ? (
                            <>
                              <Check className="size-4" />
                              Imported to Bill
                            </>
                          ) : (
                            <>
                              <PlusCircle className="size-4" />
                              Import {itemsList.length} Products into Bill
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EXACT EXTRACTED TEXT (RAW OCR FIRST) */}
                  {activeTab === 'raw_text' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileCode2 className="size-3.5 text-primary" />
                          <span>Exact line-by-line transcription directly from the receipt image:</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyRawText}
                          className="h-7 text-xs gap-1"
                        >
                          {copiedRaw ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                          {copiedRaw ? 'Copied Text' : 'Copy Raw Text'}
                        </Button>
                      </div>

                      <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 selection:bg-primary/30">
                        <pre className="whitespace-pre-wrap font-mono">
                          {result.rawText || 'No raw text transcribed.'}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FULL AI INSIGHTS */}
                  {activeTab === 'details' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Comprehensive visual breakdown and notes generated by the AI model:
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyDescription}
                          className="h-7 text-xs gap-1"
                        >
                          {copiedDesc ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                          {copiedDesc ? 'Copied' : 'Copy Notes'}
                        </Button>
                      </div>

                      <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                        {result.description}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  <p className="font-semibold">Analysis Failed</p>
                  <p>{result.error?.message || 'Unknown error occurred while contacting the vision service.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
