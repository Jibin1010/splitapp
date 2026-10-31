'use client'

import * as React from 'react'
import type { SplitMode } from '@/types/split'
import { cn } from '@/lib/utils'

export const MODES: Array<{ value: SplitMode; label: string; hint: string }> = [
  { value: 'equal', label: 'Split equally', hint: 'Same amount for everyone chosen' },
  { value: 'quantity', label: 'By quantity', hint: 'Units consumed per person' },
  { value: 'custom', label: 'Custom amounts', hint: 'Exact money amounts per person' },
  { value: 'percentage', label: 'Percentages', hint: 'Percent weights per person' },
]

interface AllocationModeSelectorProps {
  mode: SplitMode
  onSelectMode: (mode: SplitMode) => void
}

export function AllocationModeSelector({ mode, onSelectMode }: AllocationModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Split mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={mode === m.value}
          onClick={() => onSelectMode(m.value)}
          className={cn(
            'rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            mode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
          )}
        >
          <span className={cn('block text-sm font-medium', mode === m.value && 'text-primary')}>{m.label}</span>
          <span className="block text-xs text-muted-foreground">{m.hint}</span>
        </button>
      ))}
    </div>
  )
}
