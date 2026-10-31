'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  QrCode,
  Radio,
  RefreshCw,
} from 'lucide-react'

interface VerificationStatusProps {
  challengeId: string
  phoneNumber: string
  whatsappUrl: string
  expiresAt?: string
  onCancel: () => void
  onSimulateWebhook?: () => void
  isSimulating?: boolean
}

export function VerificationStatus({
  challengeId,
  phoneNumber,
  whatsappUrl,
  expiresAt,
  onCancel,
  onSimulateWebhook,
  isSimulating = false,
}: VerificationStatusProps) {
  const [copied, setCopied] = React.useState(false)
  const [showQr, setShowQr] = React.useState(false)
  const [timeLeftSec, setTimeLeftSec] = React.useState<number>(300) // Default 5 mins

  // Extract secret token and payload text from whatsappUrl
  const verificationText = React.useMemo(() => {
    try {
      const url = new URL(whatsappUrl)
      return url.searchParams.get('text') || `VERIFY ${challengeId}`
    } catch {
      return `VERIFY ${challengeId}`
    }
  }, [whatsappUrl, challengeId])

  // Countdown timer
  React.useEffect(() => {
    if (!expiresAt) return

    const targetTime = new Date(expiresAt).getTime()

    const updateTimer = () => {
      const remainingMs = targetTime - Date.now()
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000))
      setTimeLeftSec(remainingSec)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    whatsappUrl
  )}`

  return (
    <div className="space-y-4">
      {/* Timer & Listening Banner */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-700">Awaiting your message...</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-500">
          <span>Expires in:</span>
          <span className={timeLeftSec < 60 ? 'text-red-600 font-extrabold' : 'text-slate-800'}>
            {formatTime(timeLeftSec)}
          </span>
        </div>
      </div>

      {/* Target Message Preview Card */}
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

      {/* Primary Action: Open WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-[0.99]"
      >
        <MessageCircle className="size-4" />
        <span>Open WhatsApp & Send Message</span>
        <ExternalLink className="size-3.5" />
      </a>

      {/* Desktop QR Code Accordion */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <QrCode className="size-3.5 text-slate-500" />
          <span>{showQr ? 'Hide QR Code' : 'On Desktop? Scan with your phone'}</span>
        </button>

        {showQr && (
          <div className="mt-3 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
            <img
              src={qrImageUrl}
              alt="WhatsApp QR Code"
              className="size-36 rounded-lg border border-slate-100"
            />
            <p className="mt-2 text-[11px] text-slate-500 font-medium">
              Point your phone's camera at this code to open WhatsApp instantly.
            </p>
          </div>
        )}
      </div>

      {/* Testing Simulation Tool & Cancel Navigation */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
        {onSimulateWebhook && (
          <button
            type="button"
            onClick={onSimulateWebhook}
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

