'use client'

import * as React from 'react'
import { ChevronDown, Search, Sparkles, Users } from 'lucide-react'
import type { Person } from '@/types/split'
import { assignedIdsOf, billTotalsOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonForm } from '@/components/forms/person-form'
import { cn } from '@/lib/utils'
import { PersonListItem } from './people/person-list-item'
import { RemovePersonDialog } from './people/remove-person-dialog'

/**
 * People management: add/edit/remove people with profile photos, record
 * who paid how much, filter through people with instant search, and load
 * the 50 dummy people preset with a single click.
 */
export function PeoplePanel() {
  const { state, dispatch, load50DummyPeople, clearItemsAndAdjustments, activePerson, setActivePerson } = useBillStore()
  const bill = state.bill
  const totals = billTotalsOf(bill)

  const [search, setSearch] = React.useState('')
  const [removing, setRemoving] = React.useState<Person | null>(null)

  const paidTotal = bill.people.reduce((sum, p) => sum + p.paidAmount, 0)
  const paidMatches = paidTotal === totals.billTotal

  const assignedCountFor = (personId: string) =>
    bill.items.filter((item) => assignedIdsOf(item).includes(personId)).length

  const filteredPeople = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return bill.people
    return bill.people.filter((p) => p.name.toLowerCase().includes(q))
  }, [bill.people, search])

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Participants in this bill with profile photos and recorded payments.
            </p>
            <div className="flex items-center gap-1.5">
              {(bill.items.length > 0 || bill.adjustments.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearItemsAndAdjustments}
                  className="h-7 text-xs text-muted-foreground hover:text-danger"
                  title="Remove all products and adjustments"
                >
                  Clear items
                </Button>
              )}
            </div>
          </div>

          <PersonForm />

          {bill.people.length > 5 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter people by name..."
                aria-label="Filter people"
                className="pl-9 text-xs"
              />
            </div>
          )}

          {bill.people.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No participants yet. Type a name above or click &ldquo;Load 50 People&rdquo; to test with rich profiles.
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Bill participants">
              {filteredPeople.map((person) => (
                <PersonListItem
                  key={person.id}
                  person={person}
                  isPayer={person.paidAmount > 0}
                  assignedCount={assignedCountFor(person.id)}
                  isActivePerson={activePerson?.id === person.id}
                  onSetActivePerson={setActivePerson}
                  onRename={(personId, newName) => dispatch({ type: 'UPDATE_PERSON', personId, name: newName })}
                  onSetPhoto={(personId, photo) => dispatch({ type: 'SET_PERSON_PHOTO', personId, photo })}
                  onSetPaidAmount={(personId, amount) => dispatch({ type: 'SET_PAID_AMOUNT', personId, amount })}
                  onPayRemaining={(personId) => dispatch({ type: 'PAY_REMAINING', personId })}
                  onRequestRemove={setRemoving}
                />
              ))}
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

      <RemovePersonDialog
        person={removing}
        assignedCount={removing ? assignedCountFor(removing.id) : 0}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </>
  )
}
