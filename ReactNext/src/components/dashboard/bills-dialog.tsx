'use client'

import * as React from 'react'
import {
  FolderKanban,
  FilePlus2,
  RefreshCw,
  FolderOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  Search,
} from 'lucide-react'
import type { CurrencyCode } from '@/types/split'
import { formatMoney } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { getStoredUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface UserBillSummary {
  id: string
  name: string
  currency: CurrencyCode
  billTotal: number
  itemCount: number
  peopleCount: number
  participants: Array<{
    id: string
    name: string
    photo?: string
    paidAmount?: number
    isPhoneVerified?: boolean
  }>
  userShare: number
  userPaid: number
  userNet: number
  isOwner: boolean
  updatedAt: string
  hasVault: boolean
  vaultFile?: any
}

export function BillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, dispatch, startNewBill } = useBillStore()
  const [bills, setBills] = React.useState<UserBillSummary[]>([])
  const [loading, setLoading] = React.useState(false)
  const [switchingId, setSwitchingId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const authUser = React.useMemo(() => getStoredUser(), [open])

  const fetchUserBills = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (authUser?.token) headers['Authorization'] = `Bearer ${authUser.token}`
      if (authUser?.id) headers['x-identity-id'] = authUser.id

      const res = await fetch('/api/cloud-bill?action=list', { headers })
      if (!res.ok) {
        throw new Error('Failed to load your bills')
      }
      const data = await res.json()
      if (data.ok && Array.isArray(data.bills)) {
        setBills(data.bills)
      } else {
        setBills([])
      }
    } catch (err: any) {
      console.warn('Could not load user bills:', err)
      setError(err?.message || 'Could not fetch your bills')
    } finally {
      setLoading(false)
    }
  }, [authUser])

  React.useEffect(() => {
    if (open) {
      fetchUserBills()
    }
  }, [open, fetchUserBills])

  const handleOpenBill = async (billId: string) => {
    if (state.bill.id === billId) {
      onOpenChange(false)
      return
    }

    setSwitchingId(billId)
    try {
      const headers: Record<string, string> = {}
      if (authUser?.token) headers['Authorization'] = `Bearer ${authUser.token}`
      if (authUser?.id) headers['x-identity-id'] = authUser.id

      const res = await fetch(`/api/cloud-bill?billId=${encodeURIComponent(billId)}`, { headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Permission denied or bill not found')
      }

      const data = await res.json()
      if (data.ok && data.bill) {
        dispatch({ type: 'LOAD_BILL', bill: data.bill })
        onOpenChange(false)
      }
    } catch (err: any) {
      alert(err?.message || 'Could not load bill')
    } finally {
      setSwitchingId(null)
    }
  }

  const handleCreateNew = () => {
    startNewBill()
    onOpenChange(false)
  }

  const filteredBills = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return bills
    return bills.filter((b) => {
      if (b.name.toLowerCase().includes(q)) return true
      return b.participants.some((p) => p.name.toLowerCase().includes(q))
    })
  }, [bills, searchQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-[28px] border border-border/80 bg-white/95 backdrop-blur-xl shadow-2xl p-6 sm:p-7">
        <DialogHeader className="pb-3 border-b border-zinc-100 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 shadow-2xs">
                <FolderKanban className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>My Bills & Splits</span>
                  {bills.length > 0 && (
                    <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-bold">
                      {bills.length}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Bills you participate in on Supabase & Drive. Only splits you belong to are visible here.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserBills}
                disabled={loading}
                className="h-8 gap-1.5 text-xs text-slate-700 bg-white shadow-2xs"
                title="Refresh bills list from Supabase"
              >
                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                size="sm"
                onClick={handleCreateNew}
                className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <FilePlus2 className="size-3.5" />
                <span>New Split</span>
              </Button>
            </div>
          </div>

          {/* Search bar */}
          {bills.length > 2 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search bills by name or participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50/70 border-slate-200"
              />
            </div>
          )}
        </DialogHeader>

        {/* Bills List Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {loading && bills.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="size-6 animate-spin text-indigo-500" />
              <p className="text-xs font-semibold text-slate-500">
                Fetching your splits from Supabase cloud database...
              </p>
            </div>
          ) : error && bills.length === 0 ? (
            <div className="py-8 text-center rounded-2xl bg-red-50/60 border border-red-200 p-4 space-y-2">
              <p className="text-xs font-bold text-red-700">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchUserBills} className="text-xs">
                Try Again
              </Button>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
                <Receipt className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {searchQuery ? 'No matching bills found' : 'No bills yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different bill or participant name.'
                  : 'You have not participated in any bills yet. Click "New Split" or "AI Vision" to create your first bill.'}
              </p>
              <Button size="sm" onClick={handleCreateNew} className="text-xs font-bold bg-indigo-600 text-white mt-1">
                <FilePlus2 className="size-3.5 mr-1.5" />
                Start a New Split
              </Button>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isActive = state.bill.id === bill.id
              const isSwitching = switchingId === bill.id
              const otherParticipants = bill.participants.filter(
                (p) => !authUser || (p.name.toLowerCase() !== authUser.name.toLowerCase())
              )

              return (
                <div
                  key={bill.id}
                  className={cn(
                    'group relative rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs space-y-3.5',
                    isActive
                      ? 'border-indigo-400 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                          {bill.name || 'Group Split'}
                        </h4>

                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 text-white px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            Viewing Now
                          </span>
                        )}

                        {bill.hasVault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Drive 🔒
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-slate-400" />
                          {bill.updatedAt ? new Date(bill.updatedAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Recent'}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">
                          {bill.itemCount} {bill.itemCount === 1 ? 'item' : 'items'}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">
                          {bill.peopleCount} {bill.peopleCount === 1 ? 'participant' : 'participants'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary Pill */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums">
                        {formatMoney(bill.billTotal, bill.currency)}
                      </div>
                      <div className="mt-0.5">
                        {bill.userNet < 0 ? (
                          <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 tabular-nums">
                            You owe {formatMoney(-bill.userNet, bill.currency)}
                          </span>
                        ) : bill.userNet > 0 ? (
                          <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 tabular-nums">
                            You collect {formatMoney(bill.userNet, bill.currency)}
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                            Settled ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Participants in THIS bill (Image 1 representation) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[11px] font-bold uppercase text-slate-400 select-none flex items-center gap-1">
                        <Users className="size-3" />
                        Split with:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bill.participants.map((person) => (
                          <div
                            key={person.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
                          >
                            <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                            <span className="text-xs truncate max-w-[120px]">{person.name}</span>
                            {(person.paidAmount || 0) > 0 && (
                              <span className="rounded-full bg-amber-100 text-[#92400E] px-1.5 py-0.2 text-[10px] font-bold">
                                Paid {formatMoney(person.paidAmount || 0, bill.currency)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="h-8 text-xs font-bold text-indigo-700 bg-indigo-50/80 border-indigo-200 cursor-default"
                        >
                          <CheckCircle2 className="size-3.5 text-indigo-600 mr-1" />
                          <span>Active in Dashboard</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenBill(bill.id)}
                          disabled={isSwitching}
                          className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                        >
                          {isSwitching ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                          ) : (
                            <FolderOpen className="size-3.5" />
                          )}
                          <span>Open Split</span>
                          <ArrowRight className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
