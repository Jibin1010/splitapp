'use client'

import * as React from 'react'
import { FilePlus2 } from 'lucide-react'
import { useBillStore } from '@/lib/store'
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

/**
 * “New Split” action: clears the current bill and starts a fresh one.
 * Asks for confirmation whenever the current bill has content.
 */
export function NewSplitButton({ variant = 'default' }: { variant?: 'default' | 'outline' | 'ghost' }) {
  const { state, startNewBill } = useBillStore()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const hasContent = state.bill.items.length > 0 || state.bill.people.length > 0

  const handleNewSplit = () => {
    if (hasContent) {
      setConfirmOpen(true)
    } else {
      startNewBill()
    }
  }

  return (
    <>
      <Button variant={variant} onClick={handleNewSplit} className="gap-1.5">
        <FilePlus2 aria-hidden />
        New Split
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new split?</DialogTitle>
            <DialogDescription>
              This clears the current bill and starts a fresh one. If you want to keep this bill, use “Save Draft”
              first — it will stay in History.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                startNewBill()
              }}
            >
              Start new split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
