'use client'

import * as React from 'react'
import { HardDriveDownload, Settings, ShieldCheck, Trash2 } from 'lucide-react'
import type { CurrencyCode } from '@/types/split'
import { CURRENCY_META } from '@/lib/money'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SplitLedger'

/** Currency and local-data preferences. */
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, setCurrency, resetAllData } = useBillStore()
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false)

  const handleClearAll = () => {
    resetAllData()
    setConfirmClearOpen(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" aria-hidden />
              Settings
            </DialogTitle>
            <DialogDescription>Currency and local data preferences. No account, no sync.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label htmlFor="currency-select" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <Select value={state.bill.currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                <SelectTrigger id="currency-select" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
                    <SelectItem key={code} value={code}>
                      {CURRENCY_META[code].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Applies to the current bill and becomes the default for new bills.
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="size-4 text-success" aria-hidden />
                Privacy
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {APP_NAME} needs no account. Drafts, history and settings stay in this browser’s local storage.
                They won’t sync to other devices, and clearing this site’s stored data permanently removes them.
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <HardDriveDownload className="size-4 text-primary" aria-hidden />
                Local data
              </p>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                “Clear all data” wipes the autosaved draft, saved history and settings, then restores the example
                bill. There is no way to undo this.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setConfirmClearOpen(true)} className="gap-1.5">
                <Trash2 aria-hidden />
                Clear all data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all local data?</DialogTitle>
            <DialogDescription>
              The current draft, all saved history and preferences will be deleted from this browser, and the
              workspace resets to the example bill.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
