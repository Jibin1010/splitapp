'use client'

import * as React from 'react'
import { Users } from 'lucide-react'
import type { Adjustment } from '@/types/split'
import { billTotalsOf, computeAdjustmentAmount } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AdjustmentSharesDialog({
  adjustment,
  open,
  onOpenChange,
}: {
  adjustment: Adjustment
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, dispatch } = useBillStore()
  const { itemsTotal } = billTotalsOf(state.bill)
  const amount = computeAdjustmentAmount(adjustment, itemsTotal)
  const people = state.bill.people

  const [shares, setShares] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    if (!open) return
    if (adjustment.shares && Object.keys(adjustment.shares).length > 0) {
      setShares({ ...adjustment.shares })
    } else if (people.length > 0) {
      const equalPct = Math.round((100 / people.length) * 10) / 10
      const initial: Record<string, number> = {}
      people.forEach((p, idx) => {
        initial[p.id] = idx === people.length - 1 ? +(100 - equalPct * (people.length - 1)).toFixed(1) : equalPct
      })
      setShares(initial)
    }
  }, [open, adjustment.shares, people])

  const totalPercent = Object.values(shares).reduce((sum, val) => sum + (val || 0), 0)
  const isBalanced = Math.abs(totalPercent - 100) < 0.1

  const handleEqualSplit = () => {
    if (people.length === 0) return
    const equalPct = Math.round((100 / people.length) * 10) / 10
    const next: Record<string, number> = {}
    people.forEach((p, idx) => {
      next[p.id] = idx === people.length - 1 ? +(100 - equalPct * (people.length - 1)).toFixed(1) : equalPct
    })
    setShares(next)
  }

  const handleResetProportional = () => {
    dispatch({
      type: 'UPDATE_ADJUSTMENT',
      adjustmentId: adjustment.id,
      patch: { shares: undefined },
    })
    onOpenChange(false)
  }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ADJUSTMENT',
      adjustmentId: adjustment.id,
      patch: { shares },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-indigo-600" />
            <span>Customize Split: {adjustment.label}</span>
          </DialogTitle>
          <DialogDescription>
            Specify what percentage of the total adjustment ({formatMoney(amount, state.bill.currency)}) each person pays.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {people.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Add people to the bill to customize split percentages.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {people.map((person) => {
                const pct = shares[person.id] ?? 0
                const personAmount = Math.round((amount * pct) / 100)
                return (
                  <div key={person.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <PersonAvatar name={person.name} photo={person.photo} size="sm" />
                      <span className="text-xs font-bold truncate">{person.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-20">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={shares[person.id] ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setShares((prev) => ({ ...prev, [person.id]: val }))
                          }}
                          className="h-8 text-right pr-6 text-xs font-mono font-semibold"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-muted-foreground font-bold">%</span>
                      </div>
                      <span className="w-20 text-right text-xs font-semibold tabular-nums text-foreground">
                        {formatMoney(personAmount, state.bill.currency)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
            <span className="text-muted-foreground">Total percentage:</span>
            <span className={cn('font-bold font-mono', isBalanced ? 'text-success' : 'text-danger')}>
              {totalPercent.toFixed(1)}% {isBalanced ? '✓ Balanced' : '(Needs to equal 100%)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEqualSplit} className="h-8 text-xs flex-1">
              Split Equally
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetProportional} className="h-8 text-xs text-muted-foreground">
              Reset to Proportional
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isBalanced && people.length > 0}>
            Save Percentage Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
