'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import type { Allocation, ProductItem, SplitMode } from '@/types/split'
import { computeItemAllocation, lineTotalOf } from '@/lib/calculations'
import { amountToInputString, distributeEvenly, formatMoney, parseAmount } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MODES: Array<{ value: SplitMode; label: string; hint: string }> = [
  { value: 'equal', label: 'Split equally', hint: 'Same amount for everyone chosen' },
  { value: 'quantity', label: 'By quantity', hint: 'Units consumed per person' },
  { value: 'custom', label: 'Custom amounts', hint: 'Exact money amounts per person' },
  { value: 'percentage', label: 'Percentages', hint: 'Percent weights per person' },
]

function parseUnits(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Math.round(Number(trimmed))
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null
  return value
}

function parsePercent(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0 || value > 100) return null
  return Math.round(value * 100) / 100
}

/**
 * Modal editor for one product's sharing rules: choose the split mode, pick
 * the people, and enter quantities / amounts / percentages depending on the
 * mode. Arithmetic is validated live and must match the line total before
 * saving; an empty selection saves as “unassigned” (flagged by the engine).
 */
export function AllocationDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ProductItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, dispatch } = useBillStore()
  const bill = state.bill
  const people = bill.people

  const [mode, setMode] = React.useState<SplitMode>('equal')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [entries, setEntries] = React.useState<Record<string, string>>({})

  // Reset the dialog whenever a different item opens.
  React.useEffect(() => {
    if (!open || !item) return
    const allocation = item.allocation
    const nextSelected = new Set<string>()
    const nextEntries: Record<string, string> = {}
    if (allocation.mode === 'equal') {
      for (const id of allocation.participantIds) nextSelected.add(id)
    } else {
      for (const [id, value] of Object.entries(allocation.shares)) {
        if (value > 0) {
          nextSelected.add(id)
          nextEntries[id] =
            allocation.mode === 'custom' ? amountToInputString(value) : String(value)
        }
      }
    }
    setMode(allocation.mode)
    setSelected(nextSelected)
    setEntries(nextEntries)
  }, [open, item])

  const selectedIds = people.filter((p) => selected.has(p.id)).map((p) => p.id)

  // ---- Live validation for the current draft ----
  // NOTE: every hook must run before the `item === null` early return below.
  const draftAllocation: Allocation = React.useMemo(() => {
    switch (mode) {
      case 'equal':
        return { mode: 'equal', participantIds: selectedIds }
      case 'quantity': {
        const shares: Record<string, number> = {}
        for (const id of selectedIds) {
          const units = parseUnits(entries[id] ?? '') ?? 0
          if (units > 0) shares[id] = units
        }
        return { mode: 'quantity', shares }
      }
      case 'custom': {
        const shares: Record<string, number> = {}
        for (const id of selectedIds) {
          const paise = parseAmount(entries[id] ?? '') ?? 0
          if (paise > 0) shares[id] = paise
        }
        return { mode: 'custom', shares }
      }
      case 'percentage': {
        const shares: Record<string, number> = {}
        for (const id of selectedIds) {
          const percent = parsePercent(entries[id] ?? '') ?? 0
          if (percent > 0) shares[id] = percent
        }
        return { mode: 'percentage', shares }
      }
    }
  }, [mode, selectedIds, entries])

  if (!item) return null

  const lineTotal = lineTotalOf(item)
  const itemName = item.name.trim() || 'Untitled product'

  const setEntry = (personId: string, value: string) => {
    setEntries((prev) => ({ ...prev, [personId]: value }))
  }

  const togglePerson = (personId: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(personId)
      else next.delete(personId)
      return next
    })
    if (on && entries[personId] === undefined) {
      // Sensible prefill so the math starts close to correct.
      if (mode === 'quantity') {
        setEntry(personId, '1')
      } else if (mode === 'custom') {
        const sumOthers = selectedIds
          .filter((id) => id !== personId)
          .reduce((s, id) => s + (parseAmount(entries[id] ?? '') ?? 0), 0)
        const remaining = Math.max(0, lineTotal - sumOthers)
        setEntry(personId, amountToInputString(remaining))
      } else if (mode === 'percentage') {
        const sumOthers = selectedIds
          .filter((id) => id !== personId)
          .reduce((s, id) => s + (parsePercent(entries[id] ?? '') ?? 0), 0)
        setEntry(personId, String(Math.max(0, Math.round((100 - sumOthers) * 100) / 100)))
      }
    }
  }

  const selectEveryone = () => {
    setSelected(new Set(people.map((p) => p.id)))
    if (mode === 'quantity') {
      setEntries((prev) => {
        const next = { ...prev }
        for (const p of people) if (next[p.id] === undefined) next[p.id] = '1'
        return next
      })
    }
  }

  const clearPeople = () => {
    setSelected(new Set())
    setEntries({})
  }

  const evenSplit = () => {
    if (selectedIds.length === 0) return
    if (mode === 'custom') {
      const parts = distributeEvenly(lineTotal, selectedIds.length)
      setEntries((prev) => {
        const next = { ...prev }
        selectedIds.forEach((id, i) => {
          next[id] = amountToInputString(parts[i])
        })
        return next
      })
    } else if (mode === 'percentage') {
      const n = selectedIds.length
      const base = Math.floor(10000 / n)
      setEntries((prev) => {
        const next = { ...prev }
        selectedIds.forEach((id, i) => {
          const bp = i === n - 1 ? 10000 - base * (n - 1) : base
          next[id] = (bp / 100).toFixed(2)
        })
        return next
      })
    } else if (mode === 'quantity') {
      // Distribute the purchased quantity as evenly as possible.
      const parts = distributeEvenly(item.quantity, selectedIds.length)
      setEntries((prev) => {
        const next = { ...prev }
        selectedIds.forEach((id, i) => {
          next[id] = String(parts[i])
        })
        return next
      })
    }
  }

  const hasInvalidEntry =
    mode === 'quantity'
      ? selectedIds.some((id) => parseUnits(entries[id] ?? '') === null)
      : mode === 'custom'
        ? selectedIds.some((id) => parseAmount(entries[id] ?? '') === null)
        : mode === 'percentage'
          ? selectedIds.some((id) => parsePercent(entries[id] ?? '') === null)
          : false

  const status: { ok: boolean; text: string } = (() => {
    if (selectedIds.length === 0) {
      return { ok: false, text: 'No one is assigned yet — this product will count as unassigned.' }
    }
    switch (mode) {
      case 'equal':
        return {
          ok: true,
          text: `${formatMoney(Math.floor(lineTotal / selectedIds.length), bill.currency)} each, split equally between ${selectedIds.length} ${selectedIds.length === 1 ? 'person' : 'people'} (remainder paise go to the first people).`,
        }
      case 'quantity': {
        const sum = selectedIds.reduce((s, id) => s + (parseUnits(entries[id] ?? '') ?? 0), 0)
        if (sum === item.quantity) return { ok: true, text: `All ${item.quantity} ${item.quantity === 1 ? 'unit is' : 'units are'} assigned.` }
        return { ok: false, text: `${sum} of ${item.quantity} units assigned — units consumed must add up to the quantity purchased.` }
      }
      case 'custom': {
        const sum = selectedIds.reduce((s, id) => s + (parseAmount(entries[id] ?? '') ?? 0), 0)
        if (sum === lineTotal) return { ok: true, text: `Amounts add up to the line total (${formatMoney(lineTotal, bill.currency)}) exactly.` }
        const diff = Math.abs(sum - lineTotal)
        return {
          ok: false,
          text: sum < lineTotal
            ? `${formatMoney(diff, bill.currency)} still unassigned (entered ${formatMoney(sum, bill.currency)} of ${formatMoney(lineTotal, bill.currency)}).`
            : `${formatMoney(diff, bill.currency)} too much (entered ${formatMoney(sum, bill.currency)} of ${formatMoney(lineTotal, bill.currency)}).`,
        }
      }
      case 'percentage': {
        const sum = Math.round(selectedIds.reduce((s, id) => s + (parsePercent(entries[id] ?? '') ?? 0), 0) * 100) / 100
        if (sum === 100) return { ok: true, text: 'Percentages add up to exactly 100%.' }
        return { ok: false, text: `Percentages add up to ${sum}% — they must total exactly 100%.` }
      }
    }
  })()

  const preview = computeItemAllocation(bill, { ...item, allocation: draftAllocation })

  const handleSave = () => {
    dispatch({ type: 'SET_ALLOCATION', itemId: item.id, allocation: draftAllocation })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Assign people — <span className="text-primary">{itemName}</span>
          </DialogTitle>
          <DialogDescription>
            {item.quantity} × {formatMoney(item.unitPrice, bill.currency)} ={' '}
            <span className="font-semibold text-foreground">{formatMoney(lineTotal, bill.currency)}</span> total. Choose
            who shares this product and how.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Split mode">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
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

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={selectEveryone} disabled={people.length === 0}>
            <Users aria-hidden />
            Everyone
          </Button>
          <Button variant="secondary" size="sm" onClick={clearPeople} disabled={selected.size === 0}>
            Clear
          </Button>
          {mode !== 'equal' && (
            <Button variant="secondary" size="sm" onClick={evenSplit} disabled={selected.size === 0}>
              Split evenly
            </Button>
          )}
        </div>

        {people.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Add people first — use the People panel on the dashboard.
          </p>
        ) : (
          <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border" role="listbox" aria-label="Participants">
            {people.map((person) => {
              const isOn = selected.has(person.id)
              return (
                <li key={person.id} className="flex items-center gap-3 p-2.5 px-3">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm font-medium">
                    <Checkbox
                      checked={isOn}
                      onCheckedChange={(checked) => togglePerson(person.id, checked === true)}
                      aria-label={`Include ${person.name} in ${itemName}`}
                    />
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden>
                      {person.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="truncate">{person.name}</span>
                  </label>

                  {mode !== 'equal' && isOn && (
                    <div className="flex w-32 items-center gap-1.5">
                      <Input
                        value={entries[person.id] ?? ''}
                        onChange={(event) => setEntry(person.id, event.target.value)
                        }
                        inputMode={mode === 'quantity' ? 'numeric' : 'decimal'}
                        aria-label={
                          mode === 'quantity'
                            ? `Units of ${itemName} consumed by ${person.name}`
                            : mode === 'custom'
                              ? `Amount for ${person.name}`
                              : `Percentage for ${person.name}`
                        }
                        className="h-8 text-right tabular-nums"
                      />
                      <span className="w-4 text-xs text-muted-foreground" aria-hidden>
                        {mode === 'quantity' ? 'u' : mode === 'custom' ? '' : '%'}
                      </span>
                    </div>
                  )}

                  {mode !== 'equal' && !isOn && <span className="w-32 text-right text-xs text-muted-foreground">not sharing</span>}

                  {mode === 'equal' && (
                    <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                      {isOn ? formatMoney(preview.perPerson[person.id] ?? 0, bill.currency) : '—'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border p-3 text-sm',
            status.ok && selectedIds.length > 0
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-warning/30 bg-warning/5 text-warning',
          )}
          aria-live="polite"
        >
          {status.ok && selectedIds.length > 0 ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>{status.text}</span>
        </div>

        {mode !== 'equal' && selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Preview of this item's split">
            {selectedIds.map((id) => {
              const person = people.find((p) => p.id === id)
              const amount = preview.perPerson[id] ?? 0
              return (
                <Badge key={id} variant="secondary">
                  {person?.name}: {formatMoney(amount, bill.currency)}
                </Badge>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={hasInvalidEntry || (selectedIds.length > 0 && !status.ok)}>
            {selectedIds.length === 0 ? 'Save as unassigned' : 'Save assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
