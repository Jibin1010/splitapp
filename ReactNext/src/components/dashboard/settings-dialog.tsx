'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  HardDriveDownload,
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
import { getStoredUser, getUnifiedProfile, unlinkPhoneFromAccount, AuthUser } from '@/lib/auth'
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
  const [connectPhoneOpen, setConnectPhoneOpen] = React.useState(false)

  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [attachedPhone, setAttachedPhone] = React.useState<string | null>(null)
  const [authProvider, setAuthProvider] = React.useState<'google' | 'email' | 'phone' | null>(null)
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null)

  const [loadingProfile, setLoadingProfile] = React.useState(false)
  const [unlinking, setUnlinking] = React.useState(false)
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
          text: `Phone number ${res.unlinkedPhone || ''} was removed from your account. You can now connect a new number.`,
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
              Manage your connected account, attached phone number, and workspace preferences.
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

          <div className="space-y-5">
            {/* 1. ACCOUNT & CONNECTED PHONE NUMBER */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <User className="size-4 text-primary" />
                  Account & Phone Binding
                </span>
                {user ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {authProvider === 'google' ? 'Google Account' : authProvider === 'email' ? 'Email Account' : 'Phone Account'}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    Guest Mode
                  </span>
                )}
              </div>

              {user ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{user.name || 'Account User'}</p>
                      <p className="text-[11px] text-muted-foreground">{accountEmail || user.email}</p>
                    </div>
                  </div>

                  {/* Connected Phone Card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Connected Phone Number
                      </span>
                      {attachedPhone ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Attached & Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          No Phone Attached
                        </span>
                      )}
                    </div>

                    {attachedPhone ? (
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-[#229ED9] border border-sky-100">
                            <Smartphone className="size-4" />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-black text-slate-900 block">
                              {attachedPhone}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Bound exclusively to this account
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmUnlinkOpen(true)}
                          disabled={unlinking}
                          className="h-8 px-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer transition-all"
                        >
                          {unlinking ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : (
                            <Unlink className="size-3.5" />
                          )}
                          <span>Remove</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-0.5 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Attach a Telegram or WhatsApp number for 1-tap login.
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConnectPhoneOpen(true)}
                          className="h-8 px-3 text-xs font-bold text-[#229ED9] border-sky-200 hover:bg-sky-50 cursor-pointer"
                        >
                          <Phone className="size-3" />
                          <span>Attach Phone</span>
                        </Button>
                      </div>
                    )}

                    <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                      {attachedPhone ? (
                        <span>
                          🔒 <strong>Anti-abuse protection active:</strong> No other account can use or login with this
                          number. If you want to connect a different number or move it, remove it here first.
                        </span>
                      ) : (
                        <span>
                          💡 Once attached, your phone is locked exclusively to your Google/Email account.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>You are using SplitLedger as a guest. Sign in to attach your phone number, sync bills, and protect your identity.</p>
                  <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold">
                    <Link href="/login">Sign In / Create Account</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* 2. CURRENCY PREFERENCE */}
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

            {/* 3. PRIVACY & SECURITY */}
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
                Privacy & Data Security
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {APP_NAME} protects your identity with 5NF database normalization. Connected phone numbers are validated
                against physical SIM ownership with zero SMS data leaks.
              </p>
            </div>

            {/* 4. LOCAL DATA RESET */}
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <HardDriveDownload className="size-4 text-primary" aria-hidden />
                Local data
              </p>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                “Clear all data” wipes the autosaved draft, saved history and settings, then restores the example
                bill. There is no way to undo this.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setConfirmClearOpen(true)} className="gap-1.5 cursor-pointer">
                <Trash2 aria-hidden />
                Clear all data
              </Button>
            </div>
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
              Once removed, this phone number can be connected to another account or used for new verification requests.
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

      {/* MODAL: ATTACH PHONE NUMBER */}
      <Dialog open={connectPhoneOpen} onOpenChange={setConnectPhoneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-[#229ED9]" />
              Attach Phone Number
            </DialogTitle>
            <DialogDescription>
              Verify your phone number with Telegram (1-Tap) or WhatsApp to link it exclusively to your account.
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
                  text: `Phone number ${verifiedPhone} attached successfully to your account!`,
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
    </>
  )
}
