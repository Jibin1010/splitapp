import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white shadow-xs hover:bg-black',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80',
        outline: 'border border-zinc-200 bg-white/90 text-zinc-900 hover:bg-zinc-50 shadow-2xs',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        destructive: 'bg-red-500 text-white shadow-xs hover:bg-red-600',
        success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-12 px-7 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
