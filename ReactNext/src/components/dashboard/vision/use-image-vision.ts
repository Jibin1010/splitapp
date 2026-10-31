'use client'

import * as React from 'react'
import { useBillStore } from '@/lib/store'
import type {
  DialogPerson,
  EditableDetectedItem,
  VisionApiResponse,
} from './vision-types'
import { PRESET_PROMPTS, SAMPLE_RECEIPT_SVG } from './vision-types'
import { compressImageForVision } from './image-compressor'
import { SAMPLE_PEOPLE, SAMPLE_ITEMS, SAMPLE_VISION_RESULT } from './vision-sample-data'

export function useImageVision(open: boolean, onOpenChange: (open: boolean) => void) {
  const { state, dispatch, calculate } = useBillStore()

  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [imageName, setImageName] = React.useState<string>('')
  const [imageMeta, setImageMeta] = React.useState<string>('')
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

  const [dialogPeople, setDialogPeople] = React.useState<DialogPerson[]>([])
  const [newPersonName, setNewPersonName] = React.useState<string>('')
  const [customGstRupees, setCustomGstRupees] = React.useState<number>(0)
  const [gstSplitMode, setGstSplitMode] = React.useState<'equal' | 'proportional' | 'custom'>('proportional')
  const [personGstShares, setPersonGstShares] = React.useState<Record<string, number>>({})
  const [clearExistingBeforeImport, setClearExistingBeforeImport] = React.useState<boolean>(true)
  const [payerPersonId, setPayerPersonId] = React.useState<string>('')

  const [headPersonIds, setHeadPersonIds] = React.useState<string[]>([])
  const [headPaidAmounts, setHeadPaidAmounts] = React.useState<Record<string, number>>({})
  const [tailHeadPreferences, setTailHeadPreferences] = React.useState<Record<string, string>>({})

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const sampleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => () => {
    if (sampleTimeoutRef.current) clearTimeout(sampleTimeoutRef.current)
  }, [])

  React.useEffect(() => {
    if (!loading) return
    setElapsedSeconds(0)
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [loading])

  React.useEffect(() => {
    if (open) setClearExistingBeforeImport(true)
  }, [open])

  React.useEffect(() => {
    if (dialogPeople.length > 0 && (!payerPersonId || !dialogPeople.some((p) => p.id === payerPersonId))) {
      setPayerPersonId(dialogPeople[0].id)
    }
  }, [dialogPeople, payerPersonId])

  React.useEffect(() => {
    if (dialogPeople.length === 0) {
      setHeadPersonIds([])
      setHeadPaidAmounts({})
      setTailHeadPreferences({})
      return
    }
    setHeadPersonIds((prevHeads) => {
      const valid = prevHeads.filter((id) => dialogPeople.some((p) => p.id === id)).slice(0, 4)
      return valid.length > 0 ? valid : [dialogPeople[0].id]
    })
  }, [dialogPeople])

  const tailPeople = React.useMemo(() => {
    return dialogPeople.filter((p) => !headPersonIds.includes(p.id))
  }, [dialogPeople, headPersonIds])

  const computedTotalPaise = React.useMemo(() => {
    return itemsList.reduce((sum, item) => sum + item.totalPaise, 0)
  }, [itemsList])

  const totalBillRupees = React.useMemo(() => {
    return (computedTotalPaise + (applyTax ? Math.round(customGstRupees * 100) : 0)) / 100
  }, [computedTotalPaise, applyTax, customGstRupees])

  React.useEffect(() => {
    if (headPersonIds.length === 0) return
    setHeadPaidAmounts((prev) => {
      const updated = { ...prev }
      const head1Id = headPersonIds[0]
      if (headPersonIds.length === 1) {
        updated[head1Id] = totalBillRupees
      } else {
        headPersonIds.forEach((hid) => {
          if (updated[hid] === undefined) updated[hid] = 0
        })
        Object.keys(updated).forEach((id) => {
          if (!headPersonIds.includes(id)) delete updated[id]
        })
      }
      return updated
    })
  }, [headPersonIds, totalBillRupees])

  React.useEffect(() => {
    if (result?.prepopulatedItems && result.prepopulatedItems.length > 0) {
      setItemsList(result.prepopulatedItems)
    } else if (result?.detectedItems) {
      setItemsList(
        result.detectedItems.map((item, idx) => ({
          ...item,
          id: `item-${idx}-${Date.now()}`,
          assignedParticipantIds: [],
        }))
      )
    } else {
      setItemsList([])
    }

    if (result?.ok) {
      const detectedTax = result.taxPaise ? result.taxPaise / 100 : 0
      setCustomGstRupees(detectedTax)
      setApplyTax(detectedTax > 0)
      setActiveTab('products')
    }
  }, [result])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WEBP).')
      return
    }
    setImageName(file.name)
    setResult(null)
    setItemsList([])
    setImported(false)

    try {
      const compressed = await compressImageForVision(file)
      setImageSrc(compressed.dataUrl)
      const sizeKb = Math.round(compressed.sizeBytes / 1024)
      setImageMeta(`${compressed.width} × ${compressed.height} · ${sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)}MB` : `${sizeKb}KB`}`)
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string)
        setImageMeta('Ready for OCR')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async (overrideModel?: string) => {
    if (!imageSrc) return
    const modelToUse = overrideModel || selectedModel
    if (overrideModel) setSelectedModel(overrideModel)

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
          model: modelToUse,
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

  const handleLoadSampleReceipt = () => {
    if (sampleTimeoutRef.current) clearTimeout(sampleTimeoutRef.current)
    setImageName('sample-receipt-duniyav-bir.png')
    setImageSrc(SAMPLE_RECEIPT_SVG)
    setImageMeta('200 × 300 · Vector Sample')
    setLoading(true)
    setResult(null)
    setItemsList([])

    sampleTimeoutRef.current = setTimeout(() => {
      setDialogPeople(SAMPLE_PEOPLE)
      setItemsList(SAMPLE_ITEMS)
      setCustomGstRupees(33)
      setApplyTax(true)
      setResult(SAMPLE_VISION_RESULT)
      setActiveTab('products')
      setLoading(false)
    }, 1200)
  }

  const resetAll = () => {
    setImageSrc(null)
    setImageName('')
    setImageMeta('')
    setResult(null)
    setItemsList([])
    setDialogPeople([])
    setPersonGstShares({})
    setNewPersonName('')
    setImported(false)
    setCustomPrompt('')
  }

  return {
    state,
    dispatch,
    calculate,
    imageSrc,
    setImageSrc,
    imageName,
    setImageName,
    imageMeta,
    selectedModel,
    setSelectedModel,
    selectedPromptId,
    setSelectedPromptId,
    customPrompt,
    setCustomPrompt,
    loading,
    elapsedSeconds,
    result,
    setResult,
    itemsList,
    setItemsList,
    applyTax,
    setApplyTax,
    activeTab,
    setActiveTab,
    copiedRaw,
    setCopiedRaw,
    copiedDesc,
    setCopiedDesc,
    imported,
    setImported,
    dragOver,
    setDragOver,
    dialogPeople,
    setDialogPeople,
    newPersonName,
    setNewPersonName,
    customGstRupees,
    setCustomGstRupees,
    gstSplitMode,
    setGstSplitMode,
    personGstShares,
    setPersonGstShares,
    clearExistingBeforeImport,
    setClearExistingBeforeImport,
    payerPersonId,
    setPayerPersonId,
    headPersonIds,
    setHeadPersonIds,
    headPaidAmounts,
    setHeadPaidAmounts,
    tailHeadPreferences,
    setTailHeadPreferences,
    fileInputRef,
    tailPeople,
    computedTotalPaise,
    totalBillRupees,
    handleFileSelect,
    handleAnalyze,
    handleLoadSampleReceipt,
    resetAll,
  }
}
