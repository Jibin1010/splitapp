'use client'

import * as React from 'react'
import { Check, Plus, Sparkles, UserCheck, Users, Wallet } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'

export function UserSwitcherDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, dispatch, preview, activePerson, setActivePerson } = useBillStore()
  const [newName, setNewName] = React.useState('')
  const bill = state.bill
  const people = bill.people

  const handleSelectPerson = (personId: string) => {
    setActivePerson(personId)
    onOpenChange(false)
  }

  const handleAddAndSwitch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_PERSON', name: trimmed, switchTo: true })
    setNewName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Switch Profile & Perspective</DialogTitle>
              <DialogDescription className="text-xs">
                View this bill through anyone’s perspective. All bill data stays visible while spotlighting their personal share.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Active Person Spotlight in Modal */}
        {activePerson && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <PersonAvatar name={activePerson.name} photo={activePerson.photo} size="md" className="ring-2 ring-indigo-500" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground truncate">{activePerson.name}</span>
                  <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider bg-indigo-600 text-white">
                    Active Session
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {(activePerson.paidAmount || 0) > 0 ? 'Head Payer for this group' : 'Participant'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Their Share</span>
              <span className="font-extrabold text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
                {formatMoney(preview.people[activePerson.id]?.share ?? 0, bill.currency)}
              </span>
            </div>
          </div>
        )}

        {/* List of All Participants */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            All Participants ({people.length}) — Click to Switch
          </label>

          {people.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              No participants added to this bill yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {people.map((person) => {
                const isSelected = activePerson?.id === person.id
                const pRes = preview.people[person.id]
                const share = pRes?.share ?? 0
                const paid = person.paidAmount || 0
                const net = pRes?.net ?? (paid - share)
                const isHeadPayer = paid > 0

                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelectPerson(person.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-border/80 bg-card hover:border-indigo-300 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <PersonAvatar name={person.name} photo={person.photo} size="sm" />
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-bold truncate', isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground')}>
                            {person.name}
                          </span>
                          {isSelected && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-indigo-400 text-indigo-600 dark:text-indigo-400">
                              YOU
                            </Badge>
                          )}
                          {isHeadPayer && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              PAYER
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>Share: {formatMoney(share, bill.currency)}</span>
                          <span>•</span>
                          <span>Paid: {formatMoney(paid, bill.currency)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {net > 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          +{formatMoney(net, bill.currency)} to collect
                        </span>
                      ) : net < 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          {formatMoney(Math.abs(net), bill.currency)} to pay
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Settled ✓
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Add Person & Switch Form */}
        <form onSubmit={handleAddAndSwitch} className="border-t border-border pt-3">
          <label htmlFor="new-person-name" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Add New Person & View as Them
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="new-person-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Maya, Arjun, Rahul..."
              className="text-xs h-9"
            />
            <Button type="submit" size="sm" disabled={!newName.trim()} className="gap-1.5 shrink-0 h-9">
              <Plus className="size-3.5" />
              Add & Switch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
