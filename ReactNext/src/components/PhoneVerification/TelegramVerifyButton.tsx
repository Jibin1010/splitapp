'use client'

import * as React from 'react'

interface TelegramVerifyButtonProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  subtext?: string
  variant?: 'primary' | 'outline'
  className?: string
  type?: 'button' | 'submit'
}

export function TelegramVerifyButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Verify with Telegram',
  subtext = '1-Tap instant SIM verification',
  variant = 'primary',
  className = '',
  type = 'submit',
}: TelegramVerifyButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative w-full flex items-center justify-center gap-2.5 rounded-xl py-3 px-4 font-bold text-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        isPrimary
          ? 'bg-[#229ED9] text-white shadow-sm hover:bg-[#1e8ec3] hover:shadow-md'
          : 'border border-[#229ED9]/40 bg-[#229ED9]/10 text-[#0077b5] hover:bg-[#229ED9]/20'
      } ${className}`}
    >
      {loading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg
          className="size-4 shrink-0 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      )}

      <div className="flex flex-col items-start text-left">
        <span className="leading-tight">{loading ? 'Please wait...' : label}</span>
        {subtext && <span className="text-[10px] opacity-85 font-normal">{subtext}</span>}
      </div>
    </button>
  )
}

