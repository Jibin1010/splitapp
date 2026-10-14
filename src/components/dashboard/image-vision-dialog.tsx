'use client'

import * as React from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  PlusCircle,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { newId } from '@/lib/id'
import { formatMoney } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DetectedItem {
  name: string
  quantity: number
  unitPricePaise: number
  totalPaise: number
}

interface VisionApiResponse {
  ok: boolean
  model?: string
  fallbackUsed?: boolean
  durationMs?: number
  description?: string
  detectedItems?: DetectedItem[]
  error?: {
    code: string
    message: string
  }
}

const AVAILABLE_MODELS = [
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    badge: 'Fast & Reliable (~1s)',
    isRecommended: true,
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'Google DiffusionGemma 26B',
    badge: 'NVIDIA Cloud Preview',
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
    label: 'Full Bill & Item Breakdown',
    prompt:
      'Please perform a comprehensive visual and textual analysis of this image. Extract document title, invoice number, date, vendor, customer, table items (description, quantity, unit price, amount), subtotal, tax, and grand total in clear, structured Markdown.',
  },
  {
    id: 'quick',
    label: 'Quick Description',
    prompt:
      'Describe what is in this image in detail. Mention what kind of document or picture it is, all visible text, numbers, and key visual elements.',
  },
  {
    id: 'items_only',
    label: 'Extract Items & Prices Only',
    prompt:
      'Extract only the line items, quantities, and prices from this receipt/invoice. Format as a neat Markdown table.',
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
  const [copied, setCopied] = React.useState(false)
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

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WEBP).')
      return
    }
    setImageName(file.name)
    setResult(null)
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

  const handleImportItems = () => {
    if (!result?.detectedItems || result.detectedItems.length === 0) return

    for (const item of result.detectedItems) {
      dispatch({
        type: 'ADD_ITEM',
        item: {
          id: newId('item'),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPricePaise,
          allocation: { mode: 'equal', participantIds: [] },
        },
      })
    }

    setImported(true)
  }

  const handleCopyDescription = () => {
    if (!result?.description) return
    navigator.clipboard.writeText(result.description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetAll = () => {
    setImageSrc(null)
    setImageName('')
    setResult(null)
    setImported(false)
    setCustomPrompt('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold">AI Image Vision & Receipt Scanner</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Upload any bill, receipt, or photo to get a comprehensive visual description and extract items into your split.
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
                <p className="text-sm font-semibold text-foreground">Click to upload or drag & drop image</p>
                <p className="text-xs text-muted-foreground">Supports PNG, JPG, JPEG, WEBP</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc} alt="Uploaded preview" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{imageName || 'Uploaded Image'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="size-3" /> Ready for analysis
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
                  Analysis Goal
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
                          ? 'border-primary bg-primary/10 text-primary'
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
                      Analyzing with AI ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Analyze & Describe Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {result && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm animate-in fade-in-50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Visual Analysis</span>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDescription}
                    className="h-8 gap-1 text-xs"
                  >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </Button>
                </div>
              </div>

              {/* Auto-Failover Notification */}
              {result.fallbackUsed && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    DiffusionGemma was queued on NVIDIA servers. Automatically completed via <strong>Llama 3.2 11B Vision</strong> with 0 downtime!
                  </span>
                </div>
              )}

              {result.ok ? (
                <>
                  {/* Extracted Items Quick Import Card */}
                  {result.detectedItems && result.detectedItems.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                          <Check className="size-3.5" />
                          Detected {result.detectedItems.length} Products from Image
                        </span>
                        <Button
                          size="sm"
                          onClick={handleImportItems}
                          disabled={imported}
                          className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {imported ? (
                            <>
                              <Check className="size-3" />
                              Imported to Bill
                            </>
                          ) : (
                            <>
                              <PlusCircle className="size-3" />
                              Import Items into Bill
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {result.detectedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
                          >
                            <span className="font-medium text-foreground truncate mr-2">{item.name}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {item.quantity} × {formatMoney(item.unitPricePaise, 'INR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rendered Markdown Output */}
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans selection:bg-primary/20">
                    {result.description}
                  </div>
                </>
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
