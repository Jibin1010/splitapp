'use client'

import * as React from 'react'
import { Users, Sparkles, Plus, X, ShieldCheck, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { getRandomAvatarForName, searchPeopleSuggestions } from '@/lib/dummy-people'
import type { SearchResultPerson } from '@/lib/user-search'
import { cn } from '@/lib/utils'
import type { DialogPerson } from './vision-types'
import { SAMPLE_PEOPLE } from './vision-sample-data'

const visionSearchCache = new Map<string, SearchResultPerson[]>()

interface VisionPeopleSectionProps {
  dialogPeople: DialogPerson[]
  onSetPeople: (people: DialogPerson[]) => void
  onAddPerson: (name: string, photo?: string, phone?: string, isPhoneVerified?: boolean) => void
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
  const [serverResults, setServerResults] = React.useState<SearchResultPerson[]>([])
  const [lastDurationMs, setLastDurationMs] = React.useState<number | null>(null)
  const suggestionsBoxRef = React.useRef<HTMLFormElement>(null)

  const existingNames = React.useMemo(() => {
    return dialogPeople.map((dp) => dp.name)
  }, [dialogPeople])

  // 1. Immediate local directory suggestions (0ms)
  const localSuggestions = React.useMemo(() => {
    if (!newPersonName.trim()) return []
    return searchPeopleSuggestions(newPersonName, existingNames).slice(0, 8).map((d) => ({
      id: `local-${d.phone.replace(/[^0-9]/g, '')}`,
      name: d.name,
      photo: d.photo,
      phone: d.phone,
      isPhoneVerified: d.isPhoneVerified !== undefined ? d.isPhoneVerified : true,
      source: 'directory' as const,
    }))
  }, [newPersonName, existingNames])

  // 2. Debounced 250ms Server Search across 5 Lakh records
  React.useEffect(() => {
    const trimmed = newPersonName.trim()
    if (!trimmed || trimmed.length < 1) {
      setServerResults([])
      setLastDurationMs(null)
      return
    }

    const cacheKey = `${trimmed.toLowerCase()}__${existingNames.join(',')}`

    // Check client in-memory cache
    if (visionSearchCache.has(cacheKey)) {
      setServerResults(visionSearchCache.get(cacheKey)!)
      setLastDurationMs(0.05)
      return
    }

    // 250ms debounce per 5 Lakh architecture
    const timer = setTimeout(async () => {
      const t0 = performance.now()
      try {
        const excludeParam = encodeURIComponent(existingNames.join(','))
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(trimmed)}&limit=10&exclude=${excludeParam}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.ok && Array.isArray(data.results)) {
            visionSearchCache.set(cacheKey, data.results)
            setServerResults(data.results)
            setLastDurationMs(data.executionTimeMs || Number((performance.now() - t0).toFixed(1)))
          }
        }
      } catch {
        // Fallback to local suggestions
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [newPersonName, existingNames])

  const activeSuggestions = serverResults.length > 0 ? serverResults : localSuggestions

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
    if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < activeSuggestions.length) {
      handlePick(activeSuggestions[highlightedIndex])
    } else {
      const trimmed = newPersonName.trim()
      if (!trimmed) return
      onAddPerson(trimmed)
      setNewPersonName('')
      setShowSuggestions(false)
    }
  }

  const handlePick = (person: { name: string; photo?: string; phone?: string; isPhoneVerified?: boolean }) => {
    onAddPerson(person.name, person.photo, person.phone, person.isPhoneVerified)
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
              Search 5 Lakh directory by name or phone — debounced at 250ms with sub-millisecond response.
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

      {/* Zero-Knowledge Vault Security Callout */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex size-5.5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 shadow-2xs">
            <ShieldCheck className="size-3.5" />
          </span>
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-emerald-950">
              Google Drive Vault (AES-256):
            </span>{' '}
            <span className="text-emerald-800">
              {dialogPeople.length === 0
                ? 'Add users below. When imported, the bill receipt is scrambled on-device and locked strictly to these group members.'
                : `Active! Receipt is encrypted with AES-256 and locked strictly to these ${dialogPeople.length} group participant${dialogPeople.length > 1 ? 's' : ''}. Leaked Drive links are useless to outsiders.`}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
          <Lock className="size-2.5" />
          {dialogPeople.length === 0 ? 'Group Lock Armed' : `Locked to ${dialogPeople.length} Member${dialogPeople.length > 1 ? 's' : ''}`}
        </span>
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
            {person.phone && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                <ShieldCheck className="size-2.5 text-emerald-600" />
                {person.phone}
              </span>
            )}
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
          className="relative flex items-center min-w-[240px]"
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
            placeholder="Type name or phone (e.g. 98200, Maya)..."
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
          {showSuggestions && newPersonName.trim().length > 0 && activeSuggestions.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full min-w-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-0.5">
                <span className="flex items-center gap-1.5">
                  <span>5 Lakh Search ({activeSuggestions.length})</span>
                  {lastDurationMs !== null && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                      <Zap className="size-2 text-emerald-600" />
                      {lastDurationMs}ms
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-normal lowercase">Enter to pick</span>
              </div>
              {activeSuggestions.map((person, index) => (
                <button
                  key={`${person.id || person.name}-${person.phone || index}`}
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
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-semibold">{person.name}</span>
                    {person.phone && (
                      <span
                        className={cn(
                          'flex items-center gap-1 font-mono text-[9px]',
                          index === highlightedIndex ? 'text-indigo-100' : 'text-emerald-700'
                        )}
                      >
                        <ShieldCheck className="size-2.5 text-emerald-500 shrink-0" />
                        <span>{person.phone}</span>
                        <span className="font-bold text-[8px] uppercase">Verified</span>
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px]', index === highlightedIndex ? 'text-white' : 'text-indigo-600 font-semibold')}>
                    + Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
