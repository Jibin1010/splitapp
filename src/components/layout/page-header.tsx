'use client'

import * as React from 'react'
import { Save, Sparkles } from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/layout/sidebar'
import { NewSplitButton } from '@/components/layout/new-split-button'
import { formatTimestamp } from '@/lib/utils'

/**
 * Page header: bill title (inline editable), tagline, New Split and Save Draft.
 * The title falls back to “Shared Bill” until the user names the expense.
 */
export function PageHeader({
  onOpenHistory,
  onOpenSettings,
  onOpenVision,
}: {
  onOpenHistory: () => void
  onOpenSettings: () => void
  onOpenVision?: () => void
}) {
  const { state, dispatch, saveNamedDraft, draftSavedAt } = useBillStore()
  const bill = state.bill

  const savedHint = state.savedAt
    ? `Saved to History · ${formatTimestamp(state.savedAt)}`
    : draftSavedAt
      ? `Autosaved locally · ${formatTimestamp(draftSavedAt)}`
      : 'Autosaves to this browser as you edit'

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <MobileNav onOpenHistory={onOpenHistory} onOpenSettings={onOpenSettings} onOpenVision={onOpenVision} />

        <div className="min-w-0 flex-1">
          <label htmlFor="bill-name" className="sr-only">
            Bill name
          </label>
          <input
            id="bill-name"
            value={bill.name}
            onChange={(event) => dispatch({ type: 'SET_BILL_NAME', name: event.target.value.slice(0, 200) })}
            placeholder="Shared Bill"
            aria-label="Bill name"
            className="w-full max-w-md truncate rounded-md border border-transparent bg-transparent px-1 text-lg font-semibold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-border focus:border-primary/50 focus:bg-card sm:text-xl"
          />
          <p className="px-1 text-xs text-muted-foreground">Add items, assign people, split fairly</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden flex-col items-end sm:flex" aria-live="polite">
            <span className="text-[11px] leading-tight text-muted-foreground">{savedHint}</span>
          </div>
          {onOpenVision && (
            <Button
              variant="outline"
              onClick={onOpenVision}
              className="hidden sm:inline-flex gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles aria-hidden className="size-4 text-primary" />
              AI Scan
            </Button>
          )}
          <Button variant="outline" onClick={saveNamedDraft} className="gap-1.5">
            <Save aria-hidden />
            Save Draft
          </Button>
          <NewSplitButton />
        </div>
      </div>
    </header>
  )
}
