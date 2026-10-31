'use client'

import * as React from 'react'
import { FolderOpen, History, Trash2 } from 'lucide-react'
import type { HistoryEntry } from '@/types/split'
import { billTotalsOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { loadHistory, removeFromHistory } from '@/lib/storage'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatTimestamp } from '@/lib/utils'

/**
 * Locally saved bills. Everything lives in this browser's localStorage —
 * there is no cloud sync in this release.
 */
export function HistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { dispatch } = useBillStore()
  const [entries, setEntries] = React.useState<HistoryEntry[]>([])

  React.useEffect(() => {
    if (open) {
      setEntries(loadHistory())
    }
  }, [open])

  const handleOpen = (entry: HistoryEntry) => {
    dispatch({ type: 'LOAD_BILL', bill: entry.bill })
    onOpenChange(false)
  }

  const handleDelete = (entryId: string) => {
    setEntries(removeFromHistory(entryId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" aria-hidden />
            History
          </DialogTitle>
          <DialogDescription>
            Bills you saved with “Save Draft”. They live only in this browser — clearing this site’s stored data
            removes them permanently.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No saved bills yet. Use “Save Draft” in the header to keep a copy of the current bill here.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {entries.map((entry) => {
              const totals = billTotalsOf(entry.bill)
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{entry.bill.name || 'Shared Bill'}</p>
                    <p className="text-xs text-muted-foreground">
                      Saved {formatTimestamp(entry.savedAt)} · {entry.bill.items.length}{' '}
                      {entry.bill.items.length === 1 ? 'item' : 'items'} · {entry.bill.people.length}{' '}
                      {entry.bill.people.length === 1 ? 'person' : 'people'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{formatMoney(totals.billTotal, entry.bill.currency)}</Badge>
                      {entry.result && <Badge variant="success">Calculated</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => handleOpen(entry)} className="gap-1.5">
                      <FolderOpen aria-hidden />
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-danger"
                      aria-label={`Delete saved bill ${entry.bill.name || 'Shared Bill'}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
