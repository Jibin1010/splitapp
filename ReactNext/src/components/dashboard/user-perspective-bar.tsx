'use client'

import * as React from 'react'
import { ShieldCheck, Users } from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'
import { PersonalSpotlightCard } from './perspective/personal-spotlight-card'

export { PersonalSpotlightCard }

/**
 * 1-Tap horizontal chip carousel allowing users to switch who they are viewing as ("Multi-Login")
 */
export function UserPerspectiveBar({ onOpenSwitcher }: { onOpenSwitcher: () => void }) {
  const { state, activePerson, setActivePerson } = useBillStore()
  const people = state.bill.people

  if (people.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/80 bg-card/60 p-2 backdrop-blur-xs no-scrollbar">
      <button
        type="button"
        onClick={onOpenSwitcher}
        className="flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Users className="size-3" />
        </span>
        <span>View as:</span>
      </button>

      <div className="flex items-center gap-1.5 min-w-0">
        {people.map((person) => {
          const isSelected = activePerson?.id === person.id
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => setActivePerson(person.id)}
              className={cn(
                'flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all',
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <PersonAvatar name={person.name} photo={person.photo} size="xs" />
              <span>{person.name}</span>
              {person.isPhoneVerified && (
                <span title={`Verified Phone: ${person.phone || ''}`}>
                  <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
                </span>
              )}
              {isSelected && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onOpenSwitcher}
          className="flex items-center gap-1 shrink-0 rounded-xl border border-dashed border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <span>{people.length <= 1 ? '+ Add Group Member' : '+ Switch / Add'}</span>
        </button>
      </div>
    </div>
  )
}
