'use client'

import * as React from 'react'
import { Users, Sparkles, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { getRandomAvatarForName, searchPeopleSuggestions } from '@/lib/dummy-people'
import { cn } from '@/lib/utils'
import type { DialogPerson } from './vision-types'
import { SAMPLE_PEOPLE } from './vision-sample-data'

interface VisionPeopleSectionProps {
  dialogPeople: DialogPerson[]
  onSetPeople: (people: DialogPerson[]) => void
  onAddPerson: (name: string) => void
  onRemovePerson: (id: string) => void
}

export function VisionPeopleSection({
  dialogPeople,
  onSetPeople,
  onAddPerson,
  onRemovePerson,
}: VisionPeopleSectionProps) {
  const [newPersonName, setNewPersonName] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const suggestionsBoxRef = React.useRef<HTMLFormElement>(null)

  const peopleSuggestions = React.useMemo(() => {
    if (!newPersonName.trim()) return []
    const existing = dialogPeople.map((dp) => dp.name)
    return searchPeopleSuggestions(newPersonName, existing).slice(0, 8)
  }, [newPersonName, dialogPeople])

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < peopleSuggestions.length) {
      handlePick(peopleSuggestions[highlightedIndex])
    } else {
      const trimmed = newPersonName.trim()
      if (!trimmed) return
      onAddPerson(trimmed)
      setNewPersonName('')
      setShowSuggestions(false)
    }
  }

  const handlePick = (person: { name: string; photo?: string }) => {
    onAddPerson(person.name)
    setNewPersonName('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
            <Users className="size-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
              Add People / Participants ({dialogPeople.length})
            </h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Add bill participants so you can assign products and split the bill later.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPeople(SAMPLE_PEOPLE)}
            className="h-7 text-xs font-semibold gap-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="size-3 text-indigo-600" />
            Auto from Receipt
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const trimmed = newPersonName.trim()
              if (trimmed) {
                onAddPerson(trimmed)
                setNewPersonName('')
              }
            }}
            className="h-7 text-xs font-semibold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="size-3" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Existing / added people chips & inline input */}
      <div className="flex flex-wrap items-center gap-2">
        {dialogPeople.map((person) => (
          <div
            key={person.id}
            className="group flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs shadow-2xs text-slate-800 font-semibold"
          >
            <PersonAvatar name={person.name} photo={person.photo} size="xs" />
            <span>{person.name}</span>
            <button
              type="button"
              onClick={() => onRemovePerson(person.id)}
              className="text-slate-400 hover:text-red-600 rounded-full p-0.5 cursor-pointer transition-colors"
              title={`Remove ${person.name}`}
              aria-label={`Remove ${person.name}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {/* Inline input directly in the chip flow */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center min-w-[220px]"
          ref={suggestionsBoxRef}
        >
          <Input
            value={newPersonName}
            onChange={(e) => {
              setNewPersonName(e.target.value)
              setShowSuggestions(true)
              setHighlightedIndex(-1)
            }}
            onFocus={() => {
              if (newPersonName.trim().length > 0) setShowSuggestions(true)
            }}
            placeholder="Type a name and press Enter..."
            className="h-7.5 text-xs bg-white border-slate-200 rounded-full pl-3 pr-8 shadow-2xs"
          />
          <button
            type="submit"
            className="absolute right-2 text-slate-400 hover:text-indigo-600 p-0.5"
            title="Add Person"
          >
            <Users className="size-3.5" />
          </button>

          {/* Floating suggestions dropdown */}
          {showSuggestions && newPersonName.trim().length > 0 && peopleSuggestions.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full min-w-[260px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-0.5">
                <span>Suggested People ({peopleSuggestions.length})</span>
                <span className="text-[9px] font-normal lowercase">press Enter</span>
              </div>
              {peopleSuggestions.map((person, index) => (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => handlePick(person)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
                    index === highlightedIndex
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'hover:bg-slate-100 text-slate-800'
                  )}
                >
                  <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                  <span className="flex-1 truncate">{person.name}</span>
                  <span className="text-[10px] opacity-80">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
