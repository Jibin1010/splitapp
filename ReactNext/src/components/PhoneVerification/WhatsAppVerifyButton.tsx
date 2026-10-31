'use client'

import * as React from 'react'

interface WhatsAppVerifyButtonProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  subtext?: string
  variant?: 'primary' | 'outline'
  className?: string
  type?: 'button' | 'submit'
}

export function WhatsAppVerifyButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Verify with WhatsApp',
  subtext,
  variant = 'primary',
  className = '',
  type = 'submit',
}: WhatsAppVerifyButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative w-full flex items-center justify-center gap-2.5 rounded-xl py-3 px-4 font-bold text-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        isPrimary
          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md'
          : 'border border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/60'
      } ${className}`}
    >
      {loading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg
          className="size-4 shrink-0 transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.05 7.78C8.89 7.78 8.63 7.84 8.41 8.08C8.19 8.32 7.56 8.91 7.56 10.11C7.56 11.31 8.43 12.46 8.56 12.63C8.68 12.8 10.28 15.26 12.73 16.32C13.31 16.57 13.76 16.72 14.12 16.83C14.7 17.02 15.23 16.99 15.65 16.93C16.12 16.86 17.09 16.34 17.29 15.77C17.49 15.2 17.49 14.71 17.43 14.61C17.37 14.51 17.21 14.45 16.97 14.33C16.73 14.21 15.54 13.62 15.32 13.54C15.1 13.46 14.94 13.42 14.78 13.66C14.62 13.9 14.16 14.45 14.02 14.61C13.88 14.77 13.74 14.79 13.5 14.67C13.26 14.55 12.49 14.3 11.57 13.48C10.86 12.84 10.38 12.05 10.24 11.81C10.1 11.57 10.23 11.44 10.35 11.32C10.46 11.21 10.6 11.03 10.72 10.89C10.84 10.75 10.88 10.65 10.96 10.49C11.04 10.33 11 10.19 10.94 10.07C10.88 9.95 10.42 8.81 10.22 8.35C10.03 7.9 9.84 7.96 9.7 7.95C9.57 7.95 9.41 7.78 9.05 7.78Z" />
        </svg>
      )}

      <div className="flex flex-col items-start text-left">
        <span className="leading-tight">{loading ? 'Please wait...' : label}</span>
        {subtext && <span className="text-[10px] opacity-80 font-normal">{subtext}</span>}
      </div>
    </button>
  )
}

