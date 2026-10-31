'use client'

import * as React from 'react'
import { Smartphone } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  countryCode: string
  onCountryCodeChange: (code: string) => void
  disabled?: boolean
}

const COUNTRIES = [
  { code: '91', flag: '🇮🇳', name: 'India (+91)' },
  { code: '1', flag: '🇺🇸', name: 'USA (+1)' },
  { code: '44', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '971', flag: '🇦🇪', name: 'UAE (+971)' },
  { code: '65', flag: '🇸🇬', name: 'Singapore (+65)' },
  { code: '61', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '49', flag: '🇩🇪', name: 'Germany (+49)' },
  { code: '33', flag: '🇫🇷', name: 'France (+33)' },
]

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  disabled,
}: PhoneInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700">
        WhatsApp Mobile Number
      </label>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10">
        {/* Country Selector */}
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={disabled}
          className="rounded-l-xl border-r border-slate-200 bg-slate-50/80 py-2.5 pl-3 pr-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.code}
            </option>
          ))}
        </select>

        {/* Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="98765 43210"
            required
            disabled={disabled}
            className="w-full bg-transparent py-2.5 px-3.5 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Enter your WhatsApp-registered mobile number without leading 0.
      </p>
    </div>
  )
}

