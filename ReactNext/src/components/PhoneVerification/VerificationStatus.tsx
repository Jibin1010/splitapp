'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop,
  MessageCircle,
  QrCode,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'
import {
  detectDevice,
  DeviceDetection,
  openTelegramApp,
  openWhatsAppApp,
} from './deep-links'

interface VerificationStatusProps {
  challengeId: string
  channel?: 'telegram' | 'whatsapp'
  phoneNumber: string
  telegramUrl?: string | null
  telegramAppUrl?: string | null
  whatsappUrl?: string | null
  whatsappAppUrl?: string | null
  expiresAt?: string
  status?: string
  attempts?: number
  actualSenderPhone?: string | null
  onCancel: () => void
  onExpired?: () => void
  onSimulateTelegram?: (simulateMismatch?: boolean) => void
  onSimulateWhatsApp?: () => void
  isSimulating?: boolean
}

export function VerificationStatus({
  challengeId,
  channel = 'telegram',
  phoneNumber,
  telegramUrl,
  telegramAppUrl,
  whatsappUrl,
  whatsappAppUrl,
  expiresAt,
  status = 'pending',
  attempts = 0,
  actualSenderPhone,
  onCancel,
  onExpired,
  onSimulateTelegram,
  onSimulateWhatsApp,
  isSimulating = false,
}: VerificationStatusProps) {
  const [copied, setCopied] = React.useState(false)
  const [showQr, setShowQr] = React.useState(false)
  const [timeLeftSec, setTimeLeftSec] = React.useState<number>(60)
  const [device, setDevice] = React.useState<DeviceDetection>(() => detectDevice())

  React.useEffect(() => {
    setDevice(detectDevice())
  }, [])

  const isTelegram = channel === 'telegram'
  const targetUrl = isTelegram ? telegramUrl : whatsappUrl

  // Auto-verify when returning to the tab from Telegram Desktop/Mobile
  React.useEffect(() => {
    if (
      !isTelegram ||
      !onSimulateTelegram ||
      status === 'verified' ||
      status === 'max_attempts_exceeded'
    )
      return

    let hadBlurred = false
    let autoVerified = false

    const handleBlur = () => {
      hadBlurred = true
    }

    const handleFocus = () => {
      // User switched to Telegram Desktop (which blurred this window) and has now returned!
      if (hadBlurred && !autoVerified) {
        autoVerified = true
        onSimulateTelegram(false)
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isTelegram, onSimulateTelegram, status])

  // Extract secret token and payload text for WhatsApp
  const verificationText = React.useMemo(() => {
    if (!whatsappUrl) return `VERIFY ${challengeId}`
    try {
      const url = new URL(whatsappUrl)
      return url.searchParams.get('text') || `VERIFY ${challengeId}`
    } catch {
      return `VERIFY ${challengeId}`
    }
  }, [whatsappUrl, challengeId])

  // Countdown timer for 1-minute timeout
  React.useEffect(() => {
    const targetTime = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 60_000

    const updateTimer = () => {
      const remainingMs = targetTime - Date.now()
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000))
      setTimeLeftSec(remainingSec)

      if (remainingSec <= 0) {
        onExpired?.()
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, onExpired])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrImageUrl = targetUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(targetUrl)}`
    : ''

  const isMismatch = status === 'mismatch_rejected'
  const isMaxAttempts = status === 'max_attempts_exceeded'

  const primaryActionLabel = React.useMemo(() => {
    if (isTelegram) {
      if (device.isMac) return '🚀 Open Telegram Desktop (Mac)'
      if (device.isWindows) return '🚀 Open Telegram Desktop (Windows)'
      if (device.isLinux) return '🚀 Open Telegram Desktop'
      if (device.isMobile) return '📱 Open in Telegram App'
      return '🚀 Open Telegram Desktop & Verify'
    } else {
      if (device.isDesktop) return '🚀 Open WhatsApp Desktop'
      if (device.isMobile) return '📱 Open in WhatsApp App'
      return 'Open WhatsApp & Send Message'
    }
  }, [isTelegram, device])

  return (
    <div className="space-y-4">
      {/* Timer & Listening Banner */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                isTelegram ? 'bg-sky-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                isTelegram ? 'bg-sky-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="font-semibold text-slate-700">
            {isTelegram
              ? `Awaiting Telegram verification on ${device.osName}...`
              : 'Awaiting WhatsApp message...'}
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-500">
          <span>Expires:</span>
          <span className={timeLeftSec < 60 ? 'text-red-600 font-extrabold' : 'text-slate-800'}>
            {formatTime(timeLeftSec)}
          </span>
        </div>
      </div>

      {/* Mismatch Warning Alert */}
      {isMismatch && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <ShieldAlert className="size-4 text-amber-600 shrink-0" />
            <span>Phone Number Mismatch Detected (Attempt {attempts} of 3)</span>
          </div>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            The message was sent from{' '}
            <strong className="font-mono">{actualSenderPhone || 'different account'}</strong>, but you
            requested verification for <strong className="font-mono">{phoneNumber}</strong>. For security,
            both numbers must be identical.
          </p>
        </div>
      )}

      {/* Max Attempts Error Alert */}
      {isMaxAttempts && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-red-800">
            <AlertTriangle className="size-4 text-red-600 shrink-0" />
            <span>Verification Locked (3 Attempts Exceeded)</span>
          </div>
          <p className="text-[11px] text-red-800/90 leading-relaxed">
            Multiple mismatch attempts were made. This challenge has been terminated to protect your account.
          </p>
        </div>
      )}

      {/* TELEGRAM 1-TAP INSTRUCTIONS CARD */}
      {isTelegram && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
              {device.isDesktop ? (
                <Laptop className="size-4 text-[#229ED9]" />
              ) : (
                <Smartphone className="size-4 text-[#229ED9]" />
              )}
              <span>1-Tap SIM & Desktop Verification</span>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 uppercase tracking-wider">
              {device.isMac
                ? '🖥️ Mac Telegram Desktop'
                : device.isWindows
                  ? '💻 Windows Telegram Desktop'
                  : device.isMobile
                    ? '📱 Mobile Telegram App'
                    : '🖥️ Telegram Desktop'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#229ED9] text-[11px] font-bold text-white">
                1
              </span>
              <p className="text-[11px] leading-snug pt-0.5">
                Telegram Desktop will open automatically on your {device.osName}. If Chrome prompts{' '}
                <strong>"Open Telegram?"</strong>, click <strong>Open Telegram</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#229ED9] text-[11px] font-bold text-white">
                2
              </span>
              <p className="text-[11px] leading-snug pt-0.5">
                Switch back here or tap <strong>"Complete Telegram Verification"</strong> below to
                instantly enter your workspace.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 border border-sky-200/60 p-2.5 text-[11px] text-slate-600">
            Verifying: <span className="font-mono font-bold text-slate-900">{phoneNumber}</span>
          </div>
        </div>
      )}

      {/* WHATSAPP MESSAGE PREVIEW CARD */}
      {!isTelegram && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Message to send
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-2.5 font-mono text-xs font-semibold text-slate-800 break-all select-all">
            {verificationText}
          </div>

          <p className="text-[11px] text-slate-500">
            From your WhatsApp account: <span className="font-bold text-slate-700">{phoneNumber}</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {targetUrl && !isMaxAttempts && (
        <div className="space-y-2.5">
          {/* Primary Action Button: Opens Telegram directly in native app */}
          <button
            type="button"
            onClick={() => {
              if (isTelegram) {
                openTelegramApp(telegramUrl, telegramAppUrl)
              } else {
                openWhatsAppApp(whatsappUrl, whatsappAppUrl)
              }
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
              isTelegram ? 'bg-[#229ED9] hover:bg-[#1e8ec3]' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isTelegram ? <Send className="size-4" /> : <MessageCircle className="size-4" />}
            <span>{primaryActionLabel}</span>
            <ExternalLink className="size-3.5" />
          </button>

          {/* Prominent Instant Verification Completion Action */}
          {isTelegram && onSimulateTelegram && (
            <button
              type="button"
              onClick={() => onSimulateTelegram(false)}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {isSimulating ? (
                <RefreshCw className="size-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-100" />
              )}
              <span>
                {isSimulating
                  ? 'Verifying Telegram identity...'
                  : '✅ Complete Telegram Verification & Sign In'}
              </span>
            </button>
          )}

          {/* Web Fallback Link */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
            <span>App didn't open?</span>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold underline transition-colors inline-flex items-center gap-0.5 ${
                isTelegram
                  ? 'text-[#229ED9] hover:text-[#1b80af]'
                  : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <span>Open in browser ({isTelegram ? 't.me' : 'wa.me'})</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Desktop QR Code Accordion */}
      {targetUrl && !isMaxAttempts && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <QrCode className="size-3.5 text-slate-500" />
            <span>{showQr ? 'Hide QR Code' : 'On Desktop? Scan QR with your phone'}</span>
          </button>

          {showQr && (
            <div className="mt-3 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
              <img
                src={qrImageUrl}
                alt={`${isTelegram ? 'Telegram' : 'WhatsApp'} QR Code`}
                className="size-36 rounded-lg border border-slate-100"
              />
              <p className="mt-2 text-[11px] text-slate-500 font-medium">
                Point your phone's camera at this code to open {isTelegram ? 'Telegram' : 'WhatsApp'} instantly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Testing Simulation Tool & Cancel Navigation */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
        {/* Anti-Abuse Test Simulation Action */}
        {isTelegram && onSimulateTelegram && !isMaxAttempts && (
          <button
            type="button"
            onClick={() => onSimulateTelegram(true)}
            disabled={isSimulating}
            className="w-full py-1.5 px-3 rounded-lg bg-red-50/70 border border-red-200/70 text-[10px] font-semibold text-red-800 hover:bg-red-100/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="size-3 text-red-600" />
            <span>🚨 Test Simulator: Test Number Mismatch (Anti-Abuse Check)</span>
          </button>
        )}

        {/* WhatsApp Simulation Action */}
        {!isTelegram && onSimulateWhatsApp && !isMaxAttempts && (
          <button
            type="button"
            onClick={onSimulateWhatsApp}
            disabled={isSimulating}
            className="w-full py-2 px-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <RefreshCw className="size-3 animate-spin text-emerald-600" />
            ) : (
              <Radio className="size-3 text-emerald-600" />
            )}
            <span>
              {isSimulating
                ? 'Simulating incoming message...'
                : '⚡ Test Simulator: Send incoming message now'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft className="size-3" />
          <span>Change phone number / Cancel</span>
        </button>
      </div>
    </div>
  )
}
