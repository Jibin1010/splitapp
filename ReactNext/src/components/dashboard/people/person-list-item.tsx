'use client'

import * as React from 'react'
import { Check, Image as ImageIcon, Pencil, Trash2, X } from 'lucide-react'
import type { Person } from '@/types/split'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/smart-input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { cn } from '@/lib/utils'

interface PersonListItemProps {
  person: Person
  isPayer: boolean
  assignedCount: number
  isActivePerson: boolean
  onSetActivePerson: (personId: string) => void
  onRename: (personId: string, newName: string) => void
  onSetPhoto: (personId: string, photo: string) => void
  onSetPaidAmount: (personId: string, amount: number) => void
  onPayRemaining: (personId: string) => void
  onRequestRemove: (person: Person) => void
}

export function PersonListItem({
  person,
  isPayer,
  assignedCount,
  isActivePerson,
  onSetActivePerson,
  onRename,
  onSetPhoto,
  onSetPaidAmount,
  onPayRemaining,
  onRequestRemove,
}: PersonListItemProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [nameInput, setNameInput] = React.useState(person.name)
  const [editingPhoto, setEditingPhoto] = React.useState(false)
  const [photoInput, setPhotoInput] = React.useState(person.photo || '')

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== person.name) {
      onRename(person.id, trimmed)
    }
    setEditingName(false)
  }

  const savePhoto = () => {
    onSetPhoto(person.id, photoInput.trim())
    setEditingPhoto(false)
  }

  return (
    <li className="rounded-lg border border-border bg-card p-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <PersonAvatar name={person.name} photo={person.photo} size="sm" />
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
              />
              <Button size="sm" className="h-7 text-xs" onClick={saveName}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingName(false)}>
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetActivePerson(person.id)}
                  className="font-semibold text-xs text-foreground truncate hover:underline text-left"
                  title="Switch active user view to this person"
                >
                  {person.name}
                </button>
                {isActivePerson && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Active View
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {assignedCount === 0 ? 'Not assigned to any product' : `Assigned to ${assignedCount} ${assignedCount === 1 ? 'product' : 'products'}`}
              </p>
            </div>
          )}
        </div>

        {!editingName && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => {
                setPhotoInput(person.photo || '')
                setEditingPhoto(true)
              }}
              title="Edit photo URL"
              aria-label={`Change photo for ${person.name}`}
            >
              <ImageIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => {
                setNameInput(person.name)
                setEditingName(true)
              }}
              aria-label={`Rename ${person.name}`}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-danger"
              onClick={() => onRequestRemove(person)}
              aria-label={`Remove ${person.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {editingPhoto && (
        <div className="mt-2.5 flex items-center gap-2 rounded-md bg-muted/40 p-2">
          <Input
            autoFocus
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            placeholder="Paste image photo URL..."
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') savePhoto()
              if (e.key === 'Escape') setEditingPhoto(false)
            }}
          />
          <Button size="sm" className="h-7 text-xs" onClick={savePhoto}>
            Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingPhoto(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 pl-11">
        <MoneyInput
          value={person.paidAmount}
          onCommit={(amount) => onSetPaidAmount(person.id, amount)}
          aria-label={`Amount paid by ${person.name}`}
          className="h-8 w-28"
        />
        <Button
          variant="secondary"
          size="sm"
          className="gap-1 h-8 text-xs"
          onClick={() => onPayRemaining(person.id)}
          title="Mark this person as paying everything not yet covered by other payers"
        >
          <Check className="size-3" aria-hidden />
          Paid all
        </Button>
        {isPayer && <Badge variant="success">Payer</Badge>}
      </div>
    </li>
  )
}
