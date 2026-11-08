'use client'

import * as React from 'react'
import {
  UploadCloud,
  Sparkles,
  Eye,
  RotateCcw,
  Trash2,
  Lock,
  ShieldCheck,
  Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LottieScannerAnimation } from '@/components/ui/lottie-scanner'
import { cn } from '@/lib/utils'

interface VisionStepUploadProps {
  loading: boolean
  elapsedSeconds: number
  imageSrc: string | null
  imageName: string
  imageMeta?: string
  dragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onLoadSample: () => void
  onFileSelect: (file: File) => void
  onReset: () => void
  setDragOver: (over: boolean) => void
}

export function VisionStepUpload({
  loading,
  elapsedSeconds,
  imageSrc,
  imageName,
  imageMeta,
  dragOver,
  fileInputRef,
  onLoadSample,
  onFileSelect,
  onReset,
  setDragOver,
}: VisionStepUploadProps) {
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
            2
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upload Receipt Image</h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Supports PNG, JPG, JPEG, WEBP, HEIC photos of any receipt or invoice.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            className="gap-1.5 text-xs font-semibold bg-white border-slate-200/90 hover:bg-slate-50 shadow-2xs text-slate-800"
          >
            <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
            Try Sample Receipt
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            className="gap-1.5 text-xs font-semibold bg-white border-slate-200/90 hover:bg-slate-50 shadow-2xs text-slate-800"
          >
            <Camera className="size-3.5 text-indigo-600" />
            Camera
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <UploadCloud className="size-3.5" />
            Upload Photo
          </Button>
          <input
            ref={cameraInputRef as React.LegacyRef<HTMLInputElement>}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileSelect(e.target.files[0])
            }}
          />
          <input
            ref={fileInputRef as React.LegacyRef<HTMLInputElement>}
            type="file"
            accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.svg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileSelect(e.target.files[0])
            }}
          />
        </div>
      </div>

      {/* Active Lottie Vector Scanning Screen OR Preview Card OR Upload Dropzone */}
      {loading ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50 via-white to-background p-6 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/15 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col items-center">
            <LottieScannerAnimation
              width="100%"
              height={220}
              className="max-w-[420px] drop-shadow-[0_12px_24px_rgba(61,173,100,0.18)]"
            />

            <div className="mt-3 space-y-2 max-w-md w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm animate-pulse">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Scanning Receipt · {elapsedSeconds}s</span>
              </div>

              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                {elapsedSeconds === 0 && 'Reading document geometry & orientation...'}
                {elapsedSeconds === 1 && 'Transcribing line items, quantities & unit prices...'}
                {elapsedSeconds === 2 && 'Validating GST, subtotal & mathematical precision...'}
                {elapsedSeconds >= 3 && 'Reconciling line items & participant split shares...'}
              </h4>

              <p className="text-xs text-slate-500">
                100% resolution-independent vector Lottie scanner analyzing {imageName || 'document'}
              </p>

              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-300 animate-pulse"
                  style={{
                    width: `${Math.min(95, 25 + elapsedSeconds * 25)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : imageSrc ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-zinc-50 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="Receipt preview" className="size-full object-cover" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-xs font-bold text-slate-900">
                  {imageName || 'WhatsApp Image 2026-10-14 at 1.56.39 PM.jpeg'}
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  {imageMeta || '2560 × 1920 · 2.4 MB'}
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Ready for OCR & product extraction
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(imageSrc, '_blank')
                }}
                className="h-7 text-xs gap-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Eye className="size-3 text-slate-500" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs gap-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="size-3 text-slate-500" />
                Change
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                aria-label="Remove image"
                className="size-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all bg-white',
            dragOver
              ? 'border-indigo-600 bg-indigo-50/20 scale-[0.99]'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
            <UploadCloud className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Click to upload or drag & drop bill image</p>
            <p className="text-xs text-slate-500">Supports PNG, JPG, JPEG, WEBP photos of any receipt or invoice</p>
          </div>
        </div>
      )}

      {/* Google Drive Encrypted Vault Notice */}
      <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/40 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">Backup to Google Drive (Group Encrypted)</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <Lock className="size-2.5" />
            AES-256 Enabled
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          When this bill is scanned, the receipt photo is encrypted into random ciphertext before uploading to your Google Drive folder:
          <code className="bg-white border border-indigo-200 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-900 mx-1">
            SplitLedger Vault / [Group Name]
          </code>.
          Anyone who gets the Google Drive link sees only unreadable code; the secret unlock key stays strictly with verified group members.
        </p>
      </div>
    </div>
  )
}
