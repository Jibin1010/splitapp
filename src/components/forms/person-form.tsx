'use client'

import * as React from 'react'
import { AlertTriangle, UserPlus } from 'lucide-react'
import { normalizeName } from '@/lib/calculations'
import { useBillStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Add-participant form. Names must be unique per bill — “Maya” and “maya”
 * count as the same person, so duplicates are caught before dispatching.
 */
export function PersonForm() {
  const { state, dispatch } = useBillStore()
  const [name, setName] = React.useState('')
  const [warning, setWarning] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const isDuplicate = state.bill.people.some((p) => normalizeName(p.name) === normalizeName(trimmed))
    if (isDuplicate) {
      setWarning(`“${trimmed}” is already in this bill. Names are unique — spacing and capitalisation don’t matter.`)
      return
    }
    dispatch({ type: 'ADD_PERSON', name: trimmed.slice(0, 200) })
    setName('')
    setWarning(null)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (warning) setWarning(null)
          }}
          placeholder="Add a person, e.g. Maya"
          aria-label="New person name"
          aria-invalid={warning ? true : undefined}
        />
        <Button type="submit" disabled={!name.trim()} className="shrink-0 gap-1.5">
          <UserPlus aria-hidden />
          Add
        </Button>
      </div>
      {warning && (
        <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {warning}
        </p>
      )}
    </form>
  )
}
