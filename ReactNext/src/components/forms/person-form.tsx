'use client'

import * as React from 'react'
import { AlertTriangle, Image as ImageIcon, UserPlus } from 'lucide-react'
import { normalizeName } from '@/lib/calculations'
import { useBillStore } from '@/lib/store'
import { getRandomAvatarForName, searchPeopleSuggestions } from '@/lib/dummy-people'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'

/**
 * Add-participant form. Supports entering a name and optional photo URL.
 * If no photo is specified, an attractive profile avatar is automatically assigned.
 * Includes instant autocomplete suggestions when typing letters.
 */
export function PersonForm() {
  const { state, dispatch } = useBillStore()
  const [name, setName] = React.useState('')
  const [photo, setPhoto] = React.useState('')
  const [showPhotoInput, setShowPhotoInput] = React.useState(false)
  const [warning, setWarning] = React.useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const suggestionsBoxRef = React.useRef<HTMLFormElement>(null)

  const peopleSuggestions = React.useMemo(() => {
    return searchPeopleSuggestions(name, state.bill.people.map((p) => p.name))
  }, [name, state.bill.people])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const previewPhoto = photo.trim() || (name.trim() ? getRandomAvatarForName(name.trim()) : undefined)

  const handleAddDirect = (personName: string, personPhoto?: string) => {
    const trimmed = personName.trim()
    if (!trimmed) return
    const isDuplicate = state.bill.people.some(
      (p) => normalizeName(p.name) === normalizeName(trimmed),
    )
    if (isDuplicate) {
      setWarning(
        `“${trimmed}” is already in this bill. Names are unique — spacing and capitalisation don’t matter.`,
      )
      return
    }
    const finalPhoto = personPhoto?.trim() || getRandomAvatarForName(trimmed)
    dispatch({ type: 'ADD_PERSON', name: trimmed.slice(0, 200), photo: finalPhoto })
    setName('')
    setPhoto('')
    setShowPhotoInput(false)
    setShowSuggestions(false)
    setWarning(null)
    inputRef.current?.focus()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < peopleSuggestions.length) {
      const picked = peopleSuggestions[highlightedIndex]
      handleAddDirect(picked.name, picked.photo)
    } else {
      handleAddDirect(name, photo)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 relative" noValidate ref={suggestionsBoxRef}>
      <div className="flex items-center gap-2">
        {name.trim() && (
          <PersonAvatar name={name.trim()} photo={previewPhoto} size="sm" className="shrink-0" />
        )}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setShowSuggestions(true)
              setHighlightedIndex(-1)
              if (warning) setWarning(null)
            }}
            onFocus={() => {
              if (name.trim().length > 0) setShowSuggestions(true)
            }}
            onKeyDown={(e) => {
              if (!showSuggestions || peopleSuggestions.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightedIndex((prev) => (prev + 1) % peopleSuggestions.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightedIndex((prev) =>
                  prev <= 0 ? peopleSuggestions.length - 1 : prev - 1
                )
              } else if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            placeholder="Type a letter to see names, e.g. Maya"
            aria-label="New person name"
            aria-invalid={warning ? true : undefined}
            className="w-full"
          />

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && name.trim().length > 0 && peopleSuggestions.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full min-w-[240px] overflow-y-auto rounded-lg border border-border/80 bg-white p-1 shadow-xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-0.5">
                <span>Suggested People ({peopleSuggestions.length})</span>
                <span className="text-[9px] font-normal lowercase">press Enter or click</span>
              </div>
              {peopleSuggestions.map((person, index) => (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => handleAddDirect(person.name, person.photo)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
                    index === highlightedIndex
                      ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                  <span className="flex-1 truncate">{person.name}</span>
                  <span
                    className={cn(
                      'text-[10px]',
                      index === highlightedIndex
                        ? 'text-primary-foreground/90 font-semibold'
                        : 'text-muted-foreground'
                    )}
                  >
                    + Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setShowPhotoInput((prev) => !prev)}
          title="Add custom photo URL"
          aria-label="Add photo URL"
        >
          <ImageIcon className="size-4" />
        </Button>
        <Button type="submit" disabled={!name.trim()} className="shrink-0 gap-1.5">
          <UserPlus aria-hidden className="size-4" />
          Add
        </Button>
      </div>

      {showPhotoInput && (
        <div className="flex items-center gap-2 pl-1">
          <Input
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="Photo URL (optional — image link)"
            aria-label="Custom photo URL"
            className="h-8 text-xs"
          />
        </div>
      )}

      {warning && (
        <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {warning}
        </p>
      )}
    </form>
  )
}
