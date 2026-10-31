'use client'

import * as React from 'react'
import { Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABLE_MODELS } from './vision-types'

interface VisionStepModelsProps {
  selectedModel: string
  onSelectModel: (modelId: string) => void
}

export function VisionStepModels({ selectedModel, onSelectModel }: VisionStepModelsProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
          1
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            Choose Vision Model <Info className="size-3.5 text-slate-400 cursor-help" />
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Select the AI model to extract text and structured data from your receipt.
          </p>
        </div>
      </div>

      {/* 3 Model Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AVAILABLE_MODELS.map((m) => {
          const isSelected = selectedModel === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectModel(m.id)}
              className={cn(
                'relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:scale-[1.01] bg-white',
                isSelected
                  ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                  : 'border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {m.id.startsWith('google') ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-red-50 p-1">
                      <svg viewBox="0 0 24 24" className="size-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </span>
                  ) : m.id.startsWith('meta') ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 p-1">
                      <svg viewBox="0 0 24 24" className="size-5 fill-[#0668E1]">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 13.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5c1.17 0 2.21.57 2.85 1.45l-1.35 1.05c-.34-.48-.9-.8-1.5-.8-1.03 0-1.88.85-1.88 1.88s.85 1.88 1.88 1.88c.6 0 1.16-.32 1.5-.8l1.35 1.05c-.64.88-1.68 1.45-2.85 1.45zm5 0c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5c1.17 0 2.21.57 2.85 1.45l-1.35 1.05c-.34-.48-.9-.8-1.5-.8-1.03 0-1.88.85-1.88 1.88s.85 1.88 1.88 1.88c.6 0 1.16-.32 1.5-.8l1.35 1.05c-.64.88-1.68 1.45-2.85 1.45z"/>
                      </svg>
                    </span>
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 p-1">
                      <svg viewBox="0 0 24 24" className="size-5 fill-[#76B900]">
                        <path d="M8.9 4.3c-2.3 0-4.2 1.9-4.2 4.2v7c0 2.3 1.9 4.2 4.2 4.2h6.2c2.3 0 4.2-1.9 4.2-4.2v-7c0-2.3-1.9-4.2-4.2-4.2H8.9zm0 2h6.2c1.2 0 2.2 1 2.2 2.2v7c0 1.2-1 2.2-2.2 2.2H8.9c-1.2 0-2.2-1-2.2-2.2v-7c0-1.2 1-2.2 2.2-2.2z"/>
                      </svg>
                    </span>
                  )}
                  <div>
                    <p className="font-bold text-xs text-slate-900 leading-tight">{m.name}</p>
                    {m.id.startsWith('google') && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-100/90 text-[9px] font-mono font-medium text-purple-700">
                        {m.id}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected ? (
                  <div className="flex size-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full border border-slate-300" />
                )}
              </div>

              <div className="mt-2.5 space-y-0.5">
                <span className="text-[10px] font-semibold text-indigo-600">
                  {m.badge}
                </span>
                <p className="text-[10px] text-slate-500 line-clamp-1 font-normal">
                  {m.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
