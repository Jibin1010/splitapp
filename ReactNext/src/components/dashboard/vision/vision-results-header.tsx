'use client'

import * as React from 'react'
import {
  Receipt,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VisionApiResponse } from './vision-types'

interface VisionResultsHeaderProps {
  result: VisionApiResponse
  onViewRawText: () => void
  onRetryWithModel?: (modelId: string) => void
  onLoadSample?: () => void
}

export function VisionResultsHeader({
  result,
  onViewRawText,
  onRetryWithModel,
  onLoadSample,
}: VisionResultsHeaderProps) {
  if (!result.ok) {
    return (
      <div className="space-y-3">
        {/* Error Header Bar - Fixes the screenshot bug where failed state showed 'Extraction completed' */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
              <AlertTriangle className="size-4" />
            </span>
            <span className="text-sm font-bold text-rose-900">
              Analysis Failed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {result.error?.code === 'ALL_MODELS_FAILED' ? 'Timed Out' : 'OCR Error'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRetryWithModel && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRetryWithModel('google/diffusiongemma-26b-a4b-it')}
                className="gap-1.5 text-xs font-semibold bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-2xs"
              >
                <Zap className="size-3 text-indigo-600" />
                Retry with DiffusionGemma 26B
              </Button>
            )}
            {onLoadSample && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onLoadSample}
                className="gap-1.5 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Sparkles className="size-3 text-amber-500" />
                Load Demo Data
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Error Banner */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="size-4 text-rose-600 shrink-0" />
            <span>{result.error?.message || 'Vision analysis could not complete in time.'}</span>
          </div>
          <p className="text-[11px] text-rose-700 leading-relaxed pl-6">
            NVIDIA Cloud Vision server is experiencing queue congestion. You can retry with <strong>Google DiffusionGemma 26B</strong> above or load sample demo data to test calculations instantly.
          </p>
        </div>
      </div>
    )
  }

  // Success Header Bar
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Receipt className="size-4" />
          </span>
          <span className="text-sm font-bold text-slate-900">
            Analysis Result
          </span>
          {result.vendor && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700">
              🏪 {result.vendor}
            </span>
          )}
          {result.date && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700">
              📅 {result.date}
            </span>
          )}
          {result.invoiceNumber && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700">
              #{result.invoiceNumber}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Extraction completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewRawText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors"
          >
            <RotateCcw className="size-3" />
            View Raw OCR Text
          </button>
          <button
            type="button"
            className="size-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            aria-label="More options"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {/* Auto-Failover Notification */}
      {result.fallbackUsed && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Primary model took too long; automatically completed via <strong>{result.model}</strong>.
          </span>
        </div>
      )}
    </div>
  )
}
