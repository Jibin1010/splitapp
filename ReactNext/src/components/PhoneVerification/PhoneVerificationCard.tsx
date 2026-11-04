'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  Lock,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react'
import { saveStoredUser } from '@/lib/auth'
import { saveActivePersonId } from '@/lib/storage'
import { PhoneInput } from './PhoneInput'
import { WhatsAppVerifyButton } from './WhatsAppVerifyButton'
import { TelegramVerifyButton } from './TelegramVerifyButton'
import { VerificationStatus } from './VerificationStatus'
import { VerificationSuccess } from './VerificationSuccess'

export type VerificationChannel = 'telegram' | 'whatsapp'

export interface PhoneVerificationCardProps {
  onSuccess?: (phone: string) => void
  defaultCountryCode?: string
  className?: string
  showNameInput?: boolean
  initialChannel?: VerificationChannel
}

type VerificationStep = 'input' | 'waiting' | 'verified' | 'expired'

export function PhoneVerificationCard({
  onSuccess,
  defaultCountryCode = '91',
  className = '',
  showNameInput = true,
  initialChannel = 'telegram',
}: PhoneVerificationCardProps) {
  const router = useRouter()

  const [step, setStep] = React.useState<VerificationStep>('input')
  const [channel, setChannel] = React.useState<VerificationChannel>(initialChannel)
  const [countryCode, setCountryCode] = React.useState(defaultCountryCode)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [userName, setUserName] = React.useState('')

  const [challengeId, setChallengeId] = React.useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = React.useState<string | null>(null)
  const [telegramUrl, setTelegramUrl] = React.useState<string | null>(null)
  const [normalizedE164, setNormalizedE164] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null)

  const [verificationStatus, setVerificationStatus] = React.useState<string>('pending')
  const [attempts, setAttempts] = React.useState<number>(0)
  const [actualSenderPhone, setActualSenderPhone] = React.useState<string | null>(null)

  const [loading, setLoading] = React.useState(false)
  const [isSimulating, setIsSimulating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Polling loop for status verification
  React.useEffect(() => {
    if (step !== 'waiting' || !challengeId) return

    let isMounted = true
    const abortController = new AbortController()

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/phone-verification/challenges/${challengeId}`, {
          signal: abortController.signal,
        })
        const data = await res.json()

        if (!isMounted) return

        if (data.success) {
          if (data.status) {
            setVerificationStatus(data.status)
          }
          if (data.attempts !== undefined) {
            setAttempts(data.attempts)
          }
          if (data.actualSenderPhone) {
            setActualSenderPhone(data.actualSenderPhone)
          }

          if (data.status === 'verified') {
            setStep('verified')

            const verifiedPhone = data.phoneNumber || normalizedE164 || phoneNumber
            const cleanDigits = verifiedPhone.replace(/[^0-9]/g, '')
            const displayName = userName.trim() || `User ${cleanDigits.slice(-4)}`

            // Link phone to active cloud identity in Supabase 5NF
            try {
              await fetch('/api/cloud-auth/link-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: verifiedPhone }),
              })
            } catch {
              // Non-blocking if running standalone
            }

            const prefix = channel === 'telegram' ? 'tg' : 'wa'
            const user = {
              id: `${prefix}-${cleanDigits.slice(-10)}`,
              name: displayName,
              email: `${cleanDigits}@phone.splitledger.app`,
              photo: null,
              createdAt: new Date().toISOString(),
            }

            saveStoredUser(user)
            saveActivePersonId(user.id)

            setTimeout(() => {
              onSuccess?.(verifiedPhone)
              router.push('/split')
            }, 900)
          } else if (data.status === 'expired') {
            setStep('expired')
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // ignore transient poll network blips
        }
      }
    }

    // Immediate first check
    checkStatus()

    // Recurring 2s polling interval
    const interval = setInterval(checkStatus, 2000)

    return () => {
      isMounted = false
      abortController.abort()
      clearInterval(interval)
    }
  }, [step, challengeId, normalizedE164, phoneNumber, userName, channel, onSuccess, router])

  // Handle Challenge Creation (Step 2)
  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!phoneNumber.trim()) {
      setError('Please enter your mobile phone number.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/phone-verification/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          countryCode,
          channel,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to initialize phone verification.')
        return
      }

      setChallengeId(data.challengeId)
      setWhatsappUrl(data.whatsappUrl || null)
      setTelegramUrl(data.telegramUrl || null)
      setNormalizedE164(data.e164)
      setExpiresAt(data.expiresAt)
      setVerificationStatus('pending')
      setAttempts(0)
      setActualSenderPhone(null)
      setStep('waiting')

      // Automatically open Telegram or WhatsApp in a new tab if URL is available
      const redirectUrl = channel === 'telegram' ? data.telegramUrl : data.whatsappUrl
      if (typeof window !== 'undefined' && redirectUrl) {
        window.open(redirectUrl, '_blank')
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Network error occurred while connecting.')
    }
  }

  // Handle Cancellation
  const handleCancel = async () => {
    if (challengeId) {
      fetch(`/api/phone-verification/challenges/${challengeId}/cancel`, {
        method: 'POST',
      }).catch(() => {})
    }
    setStep('input')
    setChallengeId(null)
    setWhatsappUrl(null)
    setTelegramUrl(null)
    setError(null)
    setVerificationStatus('pending')
    setAttempts(0)
    setActualSenderPhone(null)
  }

  // Handle Telegram Dev Simulation
  const handleSimulateTelegram = async (simulateMismatch = false) => {
    if (!challengeId) return

    setIsSimulating(true)
    setError(null)
    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulate: true,
          challengeId,
          actualPhone: simulateMismatch ? '+919999999999' : (normalizedE164 || phoneNumber),
          simulateMismatch,
        }),
      })

      const resData = await res.json()
      if (!resData.ok && !resData.success) {
        setError(resData.error || resData.reason || 'Simulation check failed.')
      }
    } catch (err: any) {
      setError(err?.message || 'Simulation network error.')
    } finally {
      setIsSimulating(false)
    }
  }

  // Handle WhatsApp Dev Simulation
  const handleSimulateWhatsApp = async () => {
    if (!challengeId || !whatsappUrl) return

    setIsSimulating(true)
    setError(null)
    try {
      const url = new URL(whatsappUrl)
      const text = url.searchParams.get('text') || ''

      const res = await fetch('/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: normalizedE164 || phoneNumber,
          text,
          messageId: `sim_${Date.now()}`,
        }),
      })

      const resData = await res.json()
      if (!resData.success) {
        setError(resData.error || 'WhatsApp simulation failed.')
      }
    } catch (err: any) {
      setError(err?.message || 'WhatsApp simulation network error.')
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* CHANNEL SELECTOR TABS (Telegram vs WhatsApp) */}
      {step === 'input' && (
        <div className="mb-4 flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setChannel('telegram')
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
              channel === 'telegram'
                ? 'bg-[#229ED9] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="size-3.5" />
            <span>Telegram (1-Tap)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChannel('whatsapp')
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
              channel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="size-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      )}

      {/* Explanatory Banner */}
      {step === 'input' && channel === 'telegram' && (
        <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-950 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-sky-900">
            <Sparkles className="size-3.5 text-[#229ED9]" />
            <span>1-Tap SIM Card Authenticated Login</span>
          </div>
          <p className="text-[11px] leading-relaxed text-sky-900/80">
            Zero typing required. Telegram's secure protocol validates that you physically own this SIM card
            and verifies your account with 1 tap.
          </p>
        </div>
      )}

      {step === 'input' && channel === 'whatsapp' && (
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>Zero-Cost • WhatsApp Direct Verification</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800/80">
            Instead of expensive SMS codes, we generate a cryptographically signed message for you to send to
            our WhatsApp bot. You are verified instantly upon receipt!
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className={`mb-4 rounded-xl p-3 text-xs font-medium animate-in fade-in ${
            error.includes('Settings') || error.includes('attached')
              ? 'bg-amber-50 border border-amber-300 text-amber-900 space-y-1'
              : 'flex items-center gap-2 bg-red-50 border border-red-200/80 text-red-700'
          }`}
        >
          {error.includes('Settings') || error.includes('attached') ? (
            <>
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldAlert className="size-4 shrink-0 text-amber-600" />
                <span>Account Protection: Phone Number Locked</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90">{error}</p>
            </>
          ) : (
            <>
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </>
          )}
        </div>
      )}

      {/* STEP 1: INPUT FORM */}
      {step === 'input' && (
        <form onSubmit={handleStartVerification} className="space-y-4">
          {showNameInput && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Your Name (Optional)
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#229ED9] focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
            </div>
          )}

          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            disabled={loading}
          />

          {channel === 'telegram' ? (
            <TelegramVerifyButton
              loading={loading}
              disabled={!phoneNumber.trim()}
              label="Verify with Telegram"
              subtext="1-Tap secure SIM verification"
            />
          ) : (
            <WhatsAppVerifyButton
              loading={loading}
              disabled={!phoneNumber.trim()}
              label="Verify with WhatsApp"
              subtext="Sends a 1-tap verification text"
            />
          )}
        </form>
      )}

      {/* STEP 2: WAITING / POLLING */}
      {step === 'waiting' && challengeId && (
        <VerificationStatus
          challengeId={challengeId}
          channel={channel}
          phoneNumber={normalizedE164 || phoneNumber}
          telegramUrl={telegramUrl}
          whatsappUrl={whatsappUrl}
          expiresAt={expiresAt || undefined}
          status={verificationStatus}
          attempts={attempts}
          actualSenderPhone={actualSenderPhone}
          onCancel={handleCancel}
          onSimulateTelegram={handleSimulateTelegram}
          onSimulateWhatsApp={handleSimulateWhatsApp}
          isSimulating={isSimulating}
        />
      )}

      {/* STEP 3: EXPIRED STATE */}
      {step === 'expired' && (
        <div className="py-6 flex flex-col items-center text-center space-y-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Verification Session Expired</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            The 5-minute security window expired before confirmation was received.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            Start New Verification
          </button>
        </div>
      )}

      {/* STEP 4: VERIFIED */}
      {step === 'verified' && (
        <VerificationSuccess phoneNumber={normalizedE164 || phoneNumber} />
      )}
    </div>
  )
}
