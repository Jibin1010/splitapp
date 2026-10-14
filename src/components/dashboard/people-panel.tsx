'use client'

import * as React from 'react'
import { Check, ChevronDown, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import type { Person } from '@/types/split'
import { assignedIdsOf, billTotalsOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
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
import { MoneyInput } from '@/components/ui/smart-input'
import { PersonForm } from '@/components/forms/person-form'
import { cn } from '@/lib/utils'

/**
 * People management: add/edit/remove names, record who paid how much, and
 * see each person's current share after a calculation. The section is an
 * expandable card (open by default) so it also collapses cleanly on mobile.
 * Removing an assigned person asks for confirmation and clears their shares.
 */
export function PeoplePanel() {
  const { state, dispatch } = useBillStore()
  const bill = state.bill
  const totals = billTotalsOf(bill)

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [removing, setRemoving] = React.useState<Person | null>(null)

  const paidTotal = bill.people.reduce((sum, p) => sum + p.paidAmount, 0)
  const paidMatches = paidTotal === totals.billTotal

  const assignedCountFor = (personId: string) =>
    bill.items.filter((item) => assignedIdsOf(item).includes(personId)).length

  const confirmRemove = () => {
    if (!removing) return
    dispatch({ type: 'REMOVE_PERSON', personId: removing.id })
    setRemoving(null)
  }

  return (
    <>
      <details open className="group rounded-xl border border-border bg-card shadow-sm">
        <summary className="flex items-center justify-between gap-2 p-4 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Users className="size-4 text-primary" aria-hidden />
            People
          </span>
          <span className="flex items-center gap-2">
            {bill.people.length > 0 && <Badge variant="secondary">{bill.people.length}</Badge>}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>

        <div className="space-y-4 border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Names only — no profiles. Record who paid the bill so settlements know where money should go.
          </p>

          <PersonForm />

          {bill.people.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              No people yet. Add the first name — e.g. Maya, Arjun, Neha or Ravi.
            </p>
          ) : (
            <ul className="space-y-2">
              {bill.people.map((person) => {
                const isPayer = person.paidAmount > 0
                const assignedCount = assignedCountFor(person.id)
                const share = state.result?.people[person.id]?.share

                return (
                  <li key={person.id} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          isPayer ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
                        )}
                        aria-hidden
                      >
                        {person.name.trim().charAt(0).toUpperCase() || '?'}
                      </span>

                      {editingId === person.id ? (
                        <Input
                          autoFocus
                          defaultValue={person.name}
                          aria-label={`Rename ${person.name}`}
                          className="h-8 flex-1"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              const value = event.currentTarget.value.trim().slice(0, 200)
                              if (value) dispatch({ type: 'RENAME_PERSON', personId: person.id, name: value })
                              setEditingId(null)
                            }
                            if (event.key === 'Escape') setEditingId(null)
                          }}
                          onBlur={(event) => {
                            const value = event.target.value.trim().slice(0, 200)
                            if (value && value !== person.name) {
                              dispatch({ type: 'RENAME_PERSON', personId: person.id, name: value })
                            }
                            setEditingId(null)
                          }}
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignedCount === 0
                              ? 'Not assigned to any product yet'
                              : `Sharing ${assignedCount} ${assignedCount === 1 ? 'product' : 'products'}`}
                            {share !== undefined && ` · share ${formatMoney(share, bill.currency)}`}
                          </p>
                        </div>
                      )}

                      {editingId !== person.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            onClick={() => setEditingId(person.id)}
                            aria-label={`Rename ${person.name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-danger"
                            onClick={() => setRemoving(person)}
                            aria-label={`Remove ${person.name}`}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2 pl-10">
                      <MoneyInput
                        value={person.paidAmount}
                        onCommit={(amount) => dispatch({ type: 'SET_PAID_AMOUNT', personId: person.id, amount })}
                        aria-label={`Amount paid by ${person.name}`}
                        className="h-8 w-28"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => dispatch({ type: 'PAY_REMAINING', personId: person.id })}
                        title="Mark this person as paying everything not yet covered by other payers"
                      >
                        <Check aria-hidden />
                        Paid all
                      </Button>
                      {isPayer && <Badge variant="success">Payer</Badge>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {bill.people.length > 0 && (
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm',
                paidMatches ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5',
              )}
            >
              <span className="text-xs text-muted-foreground">
                {paidMatches ? 'Paid amount matches the bill total' : 'Paid so far'}
              </span>
              <span className={cn('font-semibold tabular-nums', paidMatches ? 'text-success' : 'text-warning')}>
                {formatMoney(paidTotal, bill.currency)}{' '}
                <span className="font-normal text-muted-foreground">of {formatMoney(totals.billTotal, bill.currency)}</span>
              </span>
            </div>
          )}
        </div>
      </details>

      {/* Remove-person confirmation */}
      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-danger" aria-hidden />
              Remove {removing?.name}?
            </DialogTitle>
            <DialogDescription>
              {removing && assignedCountFor(removing.id) > 0
                ? `${removing.name} is assigned to ${assignedCountFor(removing.id)} ${
                    assignedCountFor(removing.id) === 1 ? 'product' : 'products'
                  }. Removing them clears their shares — you'll need to reassign ${assignedCountFor(removing.id) === 1 ? 'that product' : 'those products'} afterwards.`
                : 'They are not assigned to any product. This cannot be undone.'}
              {removing && removing.paidAmount > 0 && ' Their recorded payment will also be removed.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
