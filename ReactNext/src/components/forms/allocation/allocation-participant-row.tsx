'use client'

import * as React from 'react'
import type { Person, SplitMode } from '@/types/split'
import { formatMoney } from '@/lib/money'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'

interface AllocationParticipantRowProps {
  person: Person
  isOn: boolean
  mode: SplitMode
  itemName: string
  currency: any
  entryValue: string
  equalPreviewPaise: number
  onToggle: (personId: string, on: boolean) => void
  onEntryChange: (personId: string, value: string) => void
}

export function AllocationParticipantRow({
  person,
  isOn,
  mode,
  itemName,
  currency,
  entryValue,
  equalPreviewPaise,
  onToggle,
  onEntryChange,
}: AllocationParticipantRowProps) {
  return (
    <li className="flex items-center gap-3 p-2 px-3">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm font-medium">
        <Checkbox
          checked={isOn}
          onCheckedChange={(checked) => onToggle(person.id, checked === true)}
          aria-label={`Include ${person.name} in ${itemName}`}
        />
        <PersonAvatar name={person.name} photo={person.photo} size="sm" />
        <span className="truncate">{person.name}</span>
      </label>

      {mode !== 'equal' && isOn && (
        <div className="flex w-32 items-center gap-1.5">
          <Input
            value={entryValue}
            onChange={(event) => onEntryChange(person.id, event.target.value)}
            inputMode={mode === 'quantity' ? 'numeric' : 'decimal'}
            aria-label={
              mode === 'quantity'
                ? `Units of ${itemName} consumed by ${person.name}`
                : mode === 'custom'
                  ? `Amount for ${person.name}`
                  : `Percentage for ${person.name}`
            }
            className="h-8 text-right tabular-nums text-xs"
          />
          <span className="w-4 text-xs text-muted-foreground" aria-hidden>
            {mode === 'quantity' ? 'u' : mode === 'custom' ? '' : '%'}
          </span>
        </div>
      )}

      {mode !== 'equal' && !isOn && <span className="w-32 text-right text-xs text-muted-foreground">not sharing</span>}

      {mode === 'equal' && (
        <span className="ml-auto text-sm tabular-nums text-muted-foreground">
          {isOn ? formatMoney(equalPreviewPaise, currency) : '—'}
        </span>
      )}
    </li>
  )
}
