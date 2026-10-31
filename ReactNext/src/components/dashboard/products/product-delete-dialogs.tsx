'use client'

import * as React from 'react'
import type { ProductItem } from '@/types/split'
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

interface ProductDeleteDialogsProps {
  deleteItem: ProductItem | null
  onCloseDelete: () => void
  onConfirmDelete: (id: string) => void
  clearAllConfirmOpen: boolean
  onCloseClearAll: () => void
  onConfirmClearAll: () => void
  totalItemsCount: number
}

export function ProductDeleteDialogs({
  deleteItem,
  onCloseDelete,
  onConfirmDelete,
  clearAllConfirmOpen,
  onCloseClearAll,
  onConfirmClearAll,
  totalItemsCount,
}: ProductDeleteDialogsProps) {
  return (
    <>
      {/* Delete confirmation */}
      <Dialog open={deleteItem !== null} onOpenChange={(open) => !open && onCloseDelete()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleteItem?.name || 'Untitled product'}”?</DialogTitle>
            <DialogDescription>
              This removes the product and its assignment. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteItem && onConfirmDelete(deleteItem.id)}
            >
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all products confirmation */}
      <Dialog open={clearAllConfirmOpen} onOpenChange={(open) => !open && onCloseClearAll()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all {totalItemsCount} products?</DialogTitle>
            <DialogDescription>
              This will remove all products from this bill. People and bill adjustments will be kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onConfirmClearAll}>
              Clear all products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
