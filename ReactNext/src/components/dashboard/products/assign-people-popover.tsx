'use client'

import * as React from 'react'
import { ChevronDown, Search, User, X } from 'lucide-react'
import type { Person, ProductItem } from '@/types/split'
import { assignedIdsOf } from '@/lib/calculations'
import { useBillStore } from '@/lib/store'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AssignPeoplePopoverProps {
  item: ProductItem
  onOpenAdvancedAllocation?: () => void
}

export function AssignPeoplePopover({
  item,
  onOpenAdvancedAllocation,
}: AssignPeoplePopoverProps) {
  const { state, dispatch } = useBillStore()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const allPeople = state.bill.people
  const assignedIds = React.useMemo(() => new Set(assignedIdsOf(item)), [item])

  const assignedPeople = React.useMemo(() => {
    return allPeople.filter((p) => assignedIds.has(p.id))
  }, [allPeople, assignedIds])

  const filteredPeople = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allPeople
    return allPeople.filter((p) => p.name.toLowerCase().includes(q))
  }, [allPeople, searchQuery])

  const handleTogglePerson = (personId: string) => {
    const nextSelected = new Set(assignedIds)
    if (nextSelected.has(personId)) {
      nextSelected.delete(personId)
    } else {
      nextSelected.add(personId)
    }

    const nextIds = Array.from(nextSelected)

    if (item.allocation.mode === 'equal') {
      dispatch({
        type: 'SET_ALLOCATION',
        itemId: item.id,
        allocation: {
          mode: 'equal',
          participantIds: nextIds,
        },
      })
    } else {
      // If in custom/quantity/percentage, maintain existing shares or add/remove
      const shares = { ...item.allocation.shares }
      if (nextSelected.has(personId)) {
        shares[personId] = shares[personId] || 1
      } else {
        delete shares[personId]
      }
      dispatch({
        type: 'SET_ALLOCATION',
        itemId: item.id,
        allocation: {
          ...item.allocation,
          shares,
        } as ProductItem['allocation'],
      })
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Overlapping Avatar Stack of Assigned People */}
      {assignedPeople.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden shrink-0">
          {assignedPeople.slice(0, 3).map((person) => (
            <PersonAvatar
              key={person.id}
              name={person.name}
              photo={person.photo}
              size="sm"
              className="size-7 ring-2 ring-white"
            />
          ))}
        </div>
      )}

      {/* Pill Button: [👤 People (N) ⌄] */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              assignedPeople.length > 0
                ? 'border-indigo-200 bg-white text-[#4F46E5] hover:bg-indigo-50/50'
                : 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50',
            )}
            aria-label={`Assigned to ${assignedPeople.length} people for ${item.name || 'item'}`}
          >
            <User className="size-3.5 text-[#4F46E5]" />
            <span>People ({assignedPeople.length})</span>
            <ChevronDown className="size-3 text-[#4F46E5]/70" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-sm font-bold text-slate-900">Assign people</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* People List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 py-1 scrollbar-thin">
            {filteredPeople.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No people found matching "{searchQuery}"
              </div>
            ) : (
              filteredPeople.map((person) => {
                const isSelected = assignedIds.has(person.id)
                return (
                  <div
                    key={person.id}
                    onClick={() => handleTogglePerson(person.id)}
                    className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50 cursor-pointer transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PersonAvatar
                        name={person.name}
                        photo={person.photo}
                        size="sm"
                        className="size-7 shrink-0 ring-1 ring-slate-200/80"
                      />
                      <span className="truncate text-xs font-semibold text-slate-800">
                        {person.name}
                      </span>
                    </div>

                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTogglePerson(person.id)}
                      className={cn(
                        'size-4.5 rounded-md border-slate-300 transition-colors',
                        isSelected && 'border-[#4F46E5] bg-[#4F46E5] text-white',
                      )}
                      aria-label={`Select ${person.name}`}
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">
              {assignedPeople.length} {assignedPeople.length === 1 ? 'person' : 'people'} selected
            </span>
            <div className="flex items-center gap-1.5">
              {item.allocation.mode !== 'equal' && onOpenAdvancedAllocation && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenAdvancedAllocation()
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline mr-1"
                >
                  Custom Split
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-[#4F46E5] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
