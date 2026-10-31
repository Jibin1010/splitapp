'use client'

import * as React from 'react'
import { FileText, ListFilter, Zap, Check, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRESET_PROMPTS } from './vision-types'

interface VisionStepModesProps {
  selectedPromptId: string
  customPrompt: string
  loading: boolean
  elapsedSeconds: number
  hasImage: boolean
  onSelectPrompt: (promptId: string) => void
  onAnalyze: () => void
}

export function VisionStepModes({
  selectedPromptId,
  customPrompt,
  loading,
  elapsedSeconds,
  hasImage,
  onSelectPrompt,
  onAnalyze,
}: VisionStepModesProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
          3
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Extraction Mode</h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Choose what to extract from the receipt.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* 3 Extraction Mode Cards */}
        <div className="flex flex-wrap items-center gap-2.5">
          {PRESET_PROMPTS.map((p) => {
            const isSelected = selectedPromptId === p.id && !customPrompt
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPrompt(p.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer',
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs'
                    : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  {p.id === 'detailed' ? (
                    <FileText className="size-4 text-indigo-600" />
                  ) : p.id === 'items_only' ? (
                    <ListFilter className="size-4 text-slate-600" />
                  ) : (
                    <Zap className="size-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold leading-tight text-slate-900">{p.label}</p>
                    {isSelected && (
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="size-2 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                    {p.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Large Glowing Analyze Button */}
        <Button
          onClick={onAnalyze}
          disabled={loading || !hasImage}
          className="gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02]"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing Receipt ({elapsedSeconds}s)...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Analyze & Extract Items →
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
