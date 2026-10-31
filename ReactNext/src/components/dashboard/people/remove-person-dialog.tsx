'use client'

import * as React from 'react'
import { UserPlus } from 'lucide-react'
import type { Person } from '@/types/split'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RemovePersonDialogProps {
  person: Person | null
  assignedCount: number
  onClose: () => void
  onConfirm: () => void
}

export function RemovePersonDialog({
  person,
  assignedCount,
  onClose,
  onConfirm,
}: RemovePersonDialogProps) {
  return (
    <Dialog open={person !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-danger" aria-hidden />
            Remove {person?.name}?
          </DialogTitle>
          <DialogDescription>
            {person && assignedCount > 0
              ? `${person.name} is assigned to ${assignedCount} ${
                  assignedCount === 1 ? 'product' : 'products'
                }. Removing them clears their shares — you'll need to reassign ${
                  assignedCount === 1 ? 'that product' : 'those products'
                } afterwards.`
              : 'They are not assigned to any product. This cannot be undone.'}
            {person && person.paidAmount > 0 && ' Their recorded payment will also be removed.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Remove person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
