'use client'

import * as React from 'react'
import { amountToInputString, parseAmount } from '@/lib/money'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Typed text inputs for money and numbers used across the editable tables.
 *
 * Behavior shared by all of them:
 *  - Free-form typing while the parsed value commits upward on every valid
 *    keystroke (so totals update live).
 *  - Display normalizes on blur.
 *  - Focusing selects the whole value, so typing replaces it naturally.
 */

function useSelectOnFocus() {
  return React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
  }, [])
}

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** Current amount in integer paise. */
  value: number
  /** Called with integer paise whenever the text parses to a valid amount. */
  onCommit: (paise: number) => void
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onCommit, className, onFocus, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState(() => amountToInputString(value))
    const lastEmitted = React.useRef(value)
    const selectOnFocus = useSelectOnFocus()

    // Zero renders empty with a placeholder so typing into a fresh row just works.
    const display = React.useCallback((paise: number) => (paise === 0 ? '' : amountToInputString(paise)), [])

    // Sync when the value is changed externally (load bill, duplicate, recalculate).
    React.useEffect(() => {
      if (value !== lastEmitted.current) {
        lastEmitted.current = value
        setText(display(value))
      }
    }, [value, display])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setText(next)
      const parsed = parseAmount(next)
      if (parsed !== null && parsed >= 0) {
        lastEmitted.current = parsed
        onCommit(parsed)
      }
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setText(display(lastEmitted.current))
      onBlur?.(event)
    }

    return (
      <Input
        ref={ref}
        inputMode="decimal"
        placeholder="0.00"
        className={cn('text-right tabular-nums', className)}
        value={text}
        onChange={handleChange}
        onFocus={(event) => {
          selectOnFocus(event)
          onFocus?.(event)
        }}
        onBlur={handleBlur}
        {...props}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'

interface IntInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
}

export const IntInput = React.forwardRef<HTMLInputElement, IntInputProps>(
  ({ value, onCommit, min = 0, max = 1_000_000, className, onFocus, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState(String(value))
    const lastEmitted = React.useRef(value)
    const selectOnFocus = useSelectOnFocus()

    React.useEffect(() => {
      if (value !== lastEmitted.current) {
        lastEmitted.current = value
        setText(String(value))
      }
    }, [value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setText(next)
      const parsed = Math.round(Number(next))
      if (next.trim() !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
        lastEmitted.current = parsed
        onCommit(parsed)
      }
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setText(String(lastEmitted.current))
      onBlur?.(event)
    }

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="1"
        className={cn('text-right tabular-nums', className)}
        value={text}
        onChange={handleChange}
        onFocus={(event) => {
          selectOnFocus(event)
          onFocus?.(event)
        }}
        onBlur={handleBlur}
        {...props}
      />
    )
  },
)
IntInput.displayName = 'IntInput'

interface FloatInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
  decimals?: number
  suffix?: string
}

export const FloatInput = React.forwardRef<HTMLInputElement, FloatInputProps>(
  ({ value, onCommit, min = 0, max = 1_000_000_000, decimals = 2, suffix, className, onFocus, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState(String(value))
    const lastEmitted = React.useRef(value)
    const factor = Math.pow(10, decimals)
    const selectOnFocus = useSelectOnFocus()

    React.useEffect(() => {
      if (value !== lastEmitted.current) {
        lastEmitted.current = value
        setText(String(value))
      }
    }, [value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setText(next)
      const trimmed = next.trim()
      if (trimmed === '') return
      const parsed = Number(trimmed)
      if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
        const rounded = Math.round(parsed * factor) / factor
        lastEmitted.current = rounded
        onCommit(rounded)
      }
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setText(String(lastEmitted.current))
      onBlur?.(event)
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          inputMode="decimal"
          className={cn('text-right tabular-nums', suffix && 'pr-7', className)}
          value={text}
          onChange={handleChange}
          onFocus={(event) => {
            selectOnFocus(event)
            onFocus?.(event)
          }}
          onBlur={handleBlur}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    )
  },
)
FloatInput.displayName = 'FloatInput'
