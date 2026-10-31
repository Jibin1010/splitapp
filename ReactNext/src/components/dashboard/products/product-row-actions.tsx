'use client'

import * as React from 'react'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import type { ProductItem } from '@/types/split'

interface ProductRowActionsProps {
  item: ProductItem
  onOpenAssignment: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (item: ProductItem) => void
}

export function ProductRowActions({
  item,
  onOpenAssignment,
  onDuplicate,
  onDelete,
}: ProductRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onOpenAssignment(item.id)}
        aria-label={`Edit ${item.name || 'product'}`}
        className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors cursor-pointer"
        title="Edit item & advanced allocation"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDuplicate(item.id)}
        aria-label={`Duplicate ${item.name || 'product'}`}
        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Duplicate item"
      >
        <Copy className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        aria-label={`Delete ${item.name || 'product'}`}
        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        title="Delete item"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
