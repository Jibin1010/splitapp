'use client'

import * as React from 'react'
import { Save, Search, Sparkles } from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
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
  onOpenUserSwitcher,
  onOpenContactSearch,
  onOpenBills,
}: {
  onOpenHistory: () => void
  onOpenSettings: () => void
  onOpenVision?: () => void
  onOpenUserSwitcher?: () => void
  onOpenContactSearch?: () => void
  onOpenBills?: () => void
}) {
  const { state, dispatch, saveNamedDraft, draftSavedAt, activePerson } = useBillStore()
  const bill = state.bill

  const savedHint = state.savedAt
    ? `Saved to History · ${formatTimestamp(state.savedAt)}`
    : draftSavedAt
      ? `Autosaved locally · ${formatTimestamp(draftSavedAt)}`
      : 'Autosaves to this browser as you edit'

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
        <MobileNav
          onOpenHistory={onOpenHistory}
          onOpenSettings={onOpenSettings}
          onOpenVision={onOpenVision}
          onOpenContactSearch={onOpenContactSearch}
          onOpenBills={onOpenBills}
        />

        {activePerson && (
          <div className="flex items-center gap-2 text-left shrink-0">
            <PersonAvatar name={activePerson.name} photo={activePerson.photo} size="sm" />
            <div className="hidden sm:block text-left leading-tight">
              <div className="font-bold text-xs text-foreground">
                Hi, {activePerson.name}!
              </div>
              <span className="text-[10px] text-muted-foreground">
                {(activePerson.paidAmount || 0) > 0 ? 'Head Payer' : 'Participant'}
              </span>
            </div>
          </div>
        )}

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
            className="w-full max-w-md truncate rounded-xl border border-transparent bg-transparent px-1.5 py-0.5 text-lg font-extrabold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-border focus:border-zinc-300 focus:bg-card sm:text-2xl"
          />
          <p className="px-1.5 text-xs font-medium text-muted-foreground">
            {bill.date || bill.invoiceNumber ? (
              <span className="flex items-center gap-2">
                {bill.date && <span>📅 {bill.date}</span>}
                {bill.invoiceNumber && <span>#{bill.invoiceNumber}</span>}
                <span>· {bill.people.length} people</span>
              </span>
            ) : (
              'Add items, assign people, split fairly'
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onOpenContactSearch && (
            <Button
              variant="outline"
              onClick={onOpenContactSearch}
              className="hidden sm:inline-flex items-center gap-1.5 border-zinc-200 bg-white/90 text-zinc-900 hover:bg-zinc-100 shadow-2xs h-9 px-3"
              title="Search 500,000 users and contacts (⌘K)"
            >
              <Search className="size-3.5 text-zinc-500" />
              <span className="text-xs font-semibold">Search Users</span>
              <kbd className="pointer-events-none hidden md:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-zinc-200 bg-zinc-100 px-1 font-mono text-[9px] font-semibold text-zinc-500">
                ⌘K
              </kbd>
            </Button>
          )}
          <div className="hidden flex-col items-end sm:flex" aria-live="polite">
            <span className="text-[11px] font-medium leading-tight text-muted-foreground">{savedHint}</span>
          </div>
          {onOpenVision && (
            <Button
              variant="outline"
              onClick={onOpenVision}
              className="hidden sm:inline-flex gap-1.5 border-zinc-200 bg-white/90 text-zinc-900 hover:bg-zinc-100"
            >
              <Sparkles aria-hidden className="size-4 text-amber-500" />
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
