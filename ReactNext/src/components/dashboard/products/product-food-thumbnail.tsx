'use client'

import * as React from 'react'
import { Utensils } from 'lucide-react'
import { getFoodImage } from '@/lib/food-images'
import { cn } from '@/lib/utils'

interface ProductFoodThumbnailProps {
  name: string
  imageUrl?: string
  className?: string
}

export function ProductFoodThumbnail({
  name,
  imageUrl,
  className,
}: ProductFoodThumbnailProps) {
  const resolvedUrl = React.useMemo(() => getFoodImage(name, imageUrl), [name, imageUrl])
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setHasError(false)
  }, [resolvedUrl])

  if (!resolvedUrl || hasError) {
    return (
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-100 via-orange-50 to-indigo-50 border border-slate-200/80 text-amber-700 shadow-2xs',
          className,
        )}
      >
        <Utensils className="size-5 opacity-70" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 shadow-2xs bg-slate-100',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="size-full object-cover object-center transition-transform hover:scale-105"
        loading="lazy"
      />
    </div>
  )
}
