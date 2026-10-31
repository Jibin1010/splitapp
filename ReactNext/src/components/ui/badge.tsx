import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-900 text-white',
        secondary: 'border-transparent bg-zinc-100 text-zinc-700',
        outline: 'border-zinc-200 bg-white text-zinc-900',
        success: 'border-emerald-200/60 bg-emerald-50 text-emerald-700',
        danger: 'border-red-200/60 bg-red-50 text-red-600',
        warning: 'border-amber-200/60 bg-amber-50 text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
