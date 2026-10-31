'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import type { Allocation, ProductItem, SplitMode } from '@/types/split'
import { computeItemAllocation, lineTotalOf } from '@/lib/calculations'
import { amountToInputString, distributeEvenly, formatMoney, parseAmount } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { parseUnits, parsePercent, computeDraftStatus } from './allocation/allocation-math'
import { AllocationModeSelector } from './allocation/allocation-mode-selector'
import { AllocationParticipantsList } from './allocation/allocation-participants-list'

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
          nextEntries[id] = allocation.mode === 'custom' ? amountToInputString(value) : String(value)
        }
      }
    }
    setMode(allocation.mode)
    setSelected(nextSelected)
    setEntries(nextEntries)
  }, [open, item])

  const selectedIds = people.filter((p) => selected.has(p.id)).map((p) => p.id)

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
      if (mode === 'quantity') {
        setEntry(personId, '1')
      } else if (mode === 'custom') {
        const sumOthers = selectedIds
          .filter((id) => id !== personId)
          .reduce((s, id) => s + (parseAmount(entries[id] ?? '') ?? 0), 0)
        setEntry(personId, amountToInputString(Math.max(0, lineTotal - sumOthers)))
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
        selectedIds.forEach((id, i) => { next[id] = amountToInputString(parts[i]) })
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
      const parts = distributeEvenly(item.quantity, selectedIds.length)
      setEntries((prev) => {
        const next = { ...prev }
        selectedIds.forEach((id, i) => { next[id] = String(parts[i]) })
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

  const status = computeDraftStatus(mode, selectedIds, entries, lineTotal, item.quantity, bill.currency)
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
            <span className="font-semibold text-foreground">{formatMoney(lineTotal, bill.currency)}</span> total. Choose who shares this product and how.
          </DialogDescription>
        </DialogHeader>

        <AllocationModeSelector mode={mode} onSelectMode={setMode} />

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

        <AllocationParticipantsList
          people={people}
          selected={selected}
          mode={mode}
          itemName={itemName}
          currency={bill.currency}
          entries={entries}
          equalPerPerson={preview.perPerson}
          onToggle={togglePerson}
          onEntryChange={setEntry}
        />

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
