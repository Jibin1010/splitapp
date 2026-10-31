'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface PersonAvatarProps {
  name: string
  photo?: string | null
  size?: AvatarSize
  className?: string
  isPayer?: boolean
  showBadge?: boolean
  ring?: boolean
}

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'size-5', text: 'text-[9px]', icon: 'size-2' },
  sm: { container: 'size-7', text: 'text-xs', icon: 'size-2.5' },
  md: { container: 'size-9', text: 'text-sm', icon: 'size-3' },
  lg: { container: 'size-11', text: 'text-base', icon: 'size-3.5' },
  xl: { container: 'size-14', text: 'text-lg', icon: 'size-4' },
}

const GRADIENTS = [
  'from-violet-600 to-indigo-600 text-white',
  'from-emerald-500 to-teal-700 text-white',
  'from-sky-500 to-blue-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-fuchsia-600 to-purple-600 text-white',
  'from-cyan-500 to-blue-500 text-white',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % GRADIENTS.length
  return GRADIENTS[index]
}

export function PersonAvatar({
  name,
  photo,
  size = 'md',
  className,
  isPayer,
  showBadge,
  ring = true,
}: PersonAvatarProps) {
  const [hasError, setHasError] = React.useState(false)
  const sizeConfig = SIZE_CLASSES[size]
  const initials = getInitials(name)
  const gradient = getGradient(name)

  // Reset error state if photo changes
  React.useEffect(() => {
    setHasError(false)
  }, [photo])

  const showImage = Boolean(photo) && !hasError

  return (
    <div
      className={cn(
        'relative shrink-0 select-none overflow-hidden rounded-full font-semibold transition-transform',
        sizeConfig.container,
        ring && (isPayer ? 'ring-2 ring-emerald-500/80 ring-offset-1' : 'ring-1 ring-border'),
        className,
      )}
      title={name}
      aria-label={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo!}
          alt={name}
          className="size-full object-cover object-center"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className={cn(
            'flex size-full items-center justify-center bg-gradient-to-br shadow-inner',
            gradient,
            sizeConfig.text,
          )}
          aria-hidden
        >
          {initials}
        </div>
      )}

      {showBadge && isPayer && (
        <span
          className="absolute bottom-0 right-0 size-2.5 rounded-full border border-background bg-emerald-500 shadow-sm"
          title="Recorded as payer"
          aria-hidden
        />
      )}
    </div>
  )
}
