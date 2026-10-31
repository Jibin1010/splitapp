'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import type { Person, SplitMode } from '@/types/split'
import { Input } from '@/components/ui/input'
import { AllocationParticipantRow } from './allocation-participant-row'

interface AllocationParticipantsListProps {
  people: Person[]
  selected: Set<string>
  mode: SplitMode
  itemName: string
  currency: any
  entries: Record<string, string>
  equalPerPerson: Record<string, number>
  onToggle: (personId: string, on: boolean) => void
  onEntryChange: (personId: string, value: string) => void
}

export function AllocationParticipantsList({
  people,
  selected,
  mode,
  itemName,
  currency,
  entries,
  equalPerPerson,
  onToggle,
  onEntryChange,
}: AllocationParticipantsListProps) {
  const [search, setSearch] = React.useState('')

  if (people.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        Add people first — use the People panel on the dashboard.
      </p>
    )
  }

  const filtered = people.filter(
    (p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <>
      {people.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${people.length} people...`}
            className="h-9 pl-8 pr-8 text-xs"
            aria-label="Filter participants"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border" role="listbox" aria-label="Participants">
        {filtered.map((person) => (
          <AllocationParticipantRow
            key={person.id}
            person={person}
            isOn={selected.has(person.id)}
            mode={mode}
            itemName={itemName}
            currency={currency}
            entryValue={entries[person.id] ?? ''}
            equalPreviewPaise={equalPerPerson[person.id] ?? 0}
            onToggle={onToggle}
            onEntryChange={onEntryChange}
          />
        ))}
      </ul>
    </>
  )
}
