'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  HardDriveDownload,
  LogOut,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlink,
  User,
} from 'lucide-react'
import type { CurrencyCode } from '@/types/split'
import { CURRENCY_META } from '@/lib/money'
import { useBillStore } from '@/lib/store'
import { getStoredUser, getUnifiedProfile, unlinkPhoneFromAccount, logout, AuthUser } from '@/lib/auth'
import { PhoneVerificationCard } from '@/components/PhoneVerification'
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

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, setCurrency, resetAllData } = useBillStore()

  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false)
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = React.useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = React.useState(false)
  const [connectPhoneOpen, setConnectPhoneOpen] = React.useState(false)

  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [attachedPhone, setAttachedPhone] = React.useState<string | null>(null)
  const [authProvider, setAuthProvider] = React.useState<'google' | 'email' | 'phone' | null>(null)
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null)

  const [loadingProfile, setLoadingProfile] = React.useState(false)
  const [unlinking, setUnlinking] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load user profile & attached phone when modal opens
  const fetchProfile = React.useCallback(async () => {
    const localUser = getStoredUser()
    setUser(localUser)
    if (localUser?.phone) {
      setAttachedPhone(localUser.phone)
    }

    setLoadingProfile(true)
    try {
      const res = await getUnifiedProfile()
      if (res.authenticated && res.unified) {
        const u = res.unified
        const phone = u.phone?.e164Phone || null
        setAttachedPhone(phone)

        if (u.google?.email) {
          setAuthProvider('google')
          setAccountEmail(u.google.email)
        } else if (u.credentials?.email) {
          setAuthProvider('email')
          setAccountEmail(u.credentials.email)
        } else if (phone) {
          setAuthProvider('phone')
        }
      } else if (localUser) {
        if (localUser.email?.includes('gmail.com')) {
          setAuthProvider('google')
          setAccountEmail(localUser.email)
        } else if (localUser.email?.includes('@phone.') || localUser.email?.includes('@whatsapp.')) {
          setAuthProvider('phone')
          const digits = localUser.email.split('@')[0]
          setAttachedPhone(`+${digits}`)
        } else {
          setAuthProvider('email')
          setAccountEmail(localUser.email)
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      setNotification(null)
      fetchProfile()
    }
  }, [open, fetchProfile])

  const handleClearAll = () => {
    resetAllData()
    setConfirmClearOpen(false)
    onOpenChange(false)
  }

  // Handle removing attached phone number
  const handleRemovePhone = async () => {
    setUnlinking(true)
    setNotification(null)

    try {
      const res = await unlinkPhoneFromAccount()
      setUnlinking(false)
      setConfirmUnlinkOpen(false)

      if (res.success) {
        setAttachedPhone(null)
        setNotification({
          type: 'success',
          text: `Phone number ${res.unlinkedPhone || ''} was removed from your account. Status: Not Linked.`,
        })
        fetchProfile()
      } else {
        setNotification({
          type: 'error',
          text: res.error || 'Failed to remove phone number.',
        })
      }
    } catch (err: any) {
      setUnlinking(false)
      setConfirmUnlinkOpen(false)
      setNotification({
        type: 'error',
        text: err?.message || 'Network error occurred.',
      })
    }
  }

  // Handle account logout
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      setUser(null)
      setAttachedPhone(null)
      setAuthProvider(null)
      setAccountEmail(null)
      setConfirmLogoutOpen(false)
      onOpenChange(false)
      window.location.href = '/login'
    } catch (err: any) {
      setLoggingOut(false)
      setConfirmLogoutOpen(false)
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to log out.',
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" aria-hidden />
              Settings
            </DialogTitle>
            <DialogDescription>
              Manage your connected account, phone number binding, and preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Alert Notification */}
          {notification && (
            <div
              className={`rounded-xl p-3 text-xs font-medium flex items-center gap-2 animate-in fade-in ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-red-600" />
              )}
              <span>{notification.text}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. PHONE NUMBER BINDING CARD (LINKED vs NOT LINKED) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex size-8 items-center justify-center rounded-xl border ${
                    attachedPhone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Phone Number
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {attachedPhone ? 'Hardware SIM binding' : 'Telegram / WhatsApp'}
                    </span>
                  </div>
                </div>

                {/* Status Pill Badge: LINKED vs NOT LINKED */}
                {attachedPhone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-2xs">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Not Linked
                  </span>
                )}
              </div>

              {/* State A: LINKED */}
              {attachedPhone ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Linked Phone Number
                      </span>
                      <span className="font-mono text-base font-black text-slate-950 block tracking-tight">
                        {attachedPhone}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmUnlinkOpen(true)}
                      disabled={unlinking}
                      className="h-8 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer transition-all"
                    >
                      {unlinking ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        <Unlink className="size-3.5" />
                      )}
                      <span>Remove</span>
                    </Button>
                  </div>

                  <p className="text-[10px] text-emerald-950/80 leading-relaxed border-t border-emerald-100 pt-2">
                    🔒 <strong>Status: Linked.</strong> This number is exclusively bonded to your account.
                    To connect a different number or log in elsewhere, tap <strong>Remove</strong>.
                  </p>
                </div>
              ) : (
                /* State B: NOT LINKED */
                <div className="rounded-xl border border-dashed border-amber-200/90 bg-amber-50/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Phone Status
                      </span>
                      <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5 pt-0.5">
                        <span className="size-2 rounded-full bg-amber-500" />
                        Not Linked
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setConnectPhoneOpen(true)}
                      className="h-8 px-3 text-xs font-bold bg-[#229ED9] hover:bg-[#1e8ec3] text-white cursor-pointer shadow-xs gap-1.5"
                    >
                      <Phone className="size-3" />
                      <span>Link Phone</span>
                    </Button>
                  </div>

                  <p className="text-[10px] text-amber-900/80 leading-relaxed border-t border-amber-200/60 pt-2">
                    ⚠️ <strong>Status: Not Linked.</strong> Link your Telegram (1-Tap) or WhatsApp phone number
                    to enable verified settlements and instant 1-tap sign in.
                  </p>
                </div>
              )}
            </div>

            {/* 2. ACCOUNT IDENTITY INFO */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <User className="size-3.5 text-slate-500" />
                  <span>Account Identity</span>
                </span>
                {user ? (
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {authProvider === 'google' ? 'Google Account' : authProvider === 'email' ? 'Email Account' : 'Phone Account'}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    Guest Mode
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{user.name || 'Account User'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{accountEmail || user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmLogoutOpen(true)}
                    className="h-7 shrink-0 gap-1.5 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer shadow-xs transition-colors"
                  >
                    <LogOut className="size-3 text-rose-500" />
                    <span>Log Out</span>
                  </Button>
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Local draft session only.</span>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs font-bold cursor-pointer">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* 3. CURRENCY PREFERENCE */}
            <div>
              <label htmlFor="currency-select" className="mb-1.5 block text-xs font-bold text-slate-700">
                Currency
              </label>
              <Select value={state.bill.currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                <SelectTrigger id="currency-select" aria-label="Currency" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
                    <SelectItem key={code} value={code} className="text-xs">
                      {CURRENCY_META[code].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Applies to the current bill and becomes default for new bills.
              </p>
            </div>

            {/* 4. PRIVACY & DATA SECURITY */}
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden />
                Privacy & Data Security
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {APP_NAME} enforces server-side 5NF data isolation. Your bills and expense groups belong strictly
                to your authenticated account and verified members added to your groups.
              </p>
            </div>

            {/* 5. DATA RESET */}
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <HardDriveDownload className="size-3.5 text-primary" aria-hidden />
                Data Reset
              </p>
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                “Clear all data” wipes your active draft and resets your workspace to a clean bill with your profile.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setConfirmClearOpen(true)} className="h-8 gap-1.5 text-xs cursor-pointer">
                <Trash2 aria-hidden className="size-3.5" />
                Clear all data
              </Button>
            </div>

            {/* 6. LOG OUT / SIGN OUT (WHEN AUTHENTICATED) */}
            {user && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <LogOut className="size-3.5 text-rose-600" aria-hidden />
                    Sign Out
                  </p>
                  <p className="text-[11px] text-rose-900/70 truncate">
                    Currently signed in as {user.name || user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmLogoutOpen(true)}
                  className="h-8 shrink-0 gap-1.5 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-100 border-rose-300 cursor-pointer shadow-xs bg-white transition-colors"
                >
                  <LogOut className="size-3.5 text-rose-600" />
                  <span>Log Out</span>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION MODAL: REMOVE PHONE NUMBER */}
      <Dialog open={confirmUnlinkOpen} onOpenChange={setConfirmUnlinkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Phone Number?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="font-mono text-slate-900">{attachedPhone}</strong> from your account?
              <br /><br />
              Once removed, status will change to <strong>Not Linked</strong>, and this number can be linked to another account or used for new verification.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={unlinking}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRemovePhone}
              disabled={unlinking}
              className="gap-1.5 cursor-pointer"
            >
              {unlinking && <RefreshCw className="size-3 animate-spin" />}
              <span>{unlinking ? 'Removing...' : 'Yes, Remove Number'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: LINK PHONE NUMBER */}
      <Dialog open={connectPhoneOpen} onOpenChange={setConnectPhoneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-[#229ED9]" />
              Link Phone Number
            </DialogTitle>
            <DialogDescription>
              Verify your mobile number with Telegram (1-Tap) or WhatsApp to link it exclusively to your account.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <PhoneVerificationCard
              showNameInput={false}
              onSuccess={(verifiedPhone) => {
                setAttachedPhone(verifiedPhone)
                setConnectPhoneOpen(false)
                setNotification({
                  type: 'success',
                  text: `Phone number ${verifiedPhone} is now Linked to your account!`,
                })
                fetchProfile()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION MODAL: CLEAR LOCAL DATA */}
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

      {/* CONFIRMATION MODAL: LOG OUT */}
      <Dialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <LogOut className="size-5 text-rose-600" aria-hidden />
              Sign out of {APP_NAME}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              You will be signed out of <strong>{user?.name || accountEmail || user?.email || 'your account'}</strong> on this browser. Your cloud bills and split history remain safe in the cloud.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLogoutOpen(false)}
              disabled={loggingOut}
              className="text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              {loggingOut ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="size-3.5" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
