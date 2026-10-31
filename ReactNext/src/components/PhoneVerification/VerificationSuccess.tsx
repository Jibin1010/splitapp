'use client'

import * as React from 'react'
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

interface VerificationSuccessProps {
  phoneNumber: string
  subtext?: string
}

export function VerificationSuccess({
  phoneNumber,
  subtext = 'Your phone number has been verified securely. Redirecting to your workspace...',
}: VerificationSuccessProps) {
  return (
    <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
      <div className="relative flex items-center justify-center size-16 rounded-full bg-emerald-100/80 text-emerald-600 shadow-sm">
        <CheckCircle2 className="size-9 stroke-[2.5]" />
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
          <ShieldCheck className="size-3" />
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          WhatsApp Verified!
        </h3>
        <p className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
          {phoneNumber}
        </p>
      </div>

      <p className="text-xs text-slate-500 max-w-xs">{subtext}</p>

      <div className="flex items-center gap-1.5 pt-2 text-[11px] font-semibold text-emerald-800">
        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <span>Loading SplitLedger...</span>
      </div>
    </div>
  )
}

