'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LottieScannerProps {
  className?: string
  width?: number | string
  height?: number | string
  loop?: boolean
  autoplay?: boolean
  showStatusBadge?: boolean
  statusText?: string
}

export function LottieScannerAnimation({
  className,
  width = 360,
  height = 240,
  loop = true,
  autoplay = true,
  showStatusBadge = false,
  statusText = 'AI OCR Scanning...',
}: LottieScannerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const animRef = React.useRef<unknown>(null)
  const [lottieLoaded, setLottieLoaded] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    async function initLottie() {
      if (!containerRef.current) return
      try {
        const lottieModule = await import('lottie-web')
        const lottie = lottieModule.default || lottieModule

        const res = await fetch('/animations/scanning-document.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const animationData = await res.json()

        if (!isMounted || !containerRef.current) return

        // Destroy existing instance if any
        if (animRef.current && typeof (animRef.current as { destroy: () => void }).destroy === 'function') {
          ;(animRef.current as { destroy: () => void }).destroy()
        }

        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          animationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          },
        })

        animRef.current = anim
        setLottieLoaded(true)
      } catch (err) {
        console.warn('Lottie dynamic load fallback to pure vector SVG:', err)
        if (isMounted) setLottieLoaded(false)
      }
    }

    initLottie()

    return () => {
      isMounted = false
      if (animRef.current && typeof (animRef.current as { destroy: () => void }).destroy === 'function') {
        ;(animRef.current as { destroy: () => void }).destroy()
      }
    }
  }, [loop, autoplay])

  return (
    <div className={cn('relative flex flex-col items-center justify-center select-none', className)}>
      {/* Lottie Vector SVG Container */}
      <div
        ref={containerRef}
        style={{ width, height }}
        className={cn(
          'relative flex items-center justify-center transition-opacity duration-300 [&>svg]:w-full [&>svg]:h-full',
          lottieLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Pure Vector SVG Fallback (also renders immediately while Lottie loads or during SSR) */}
      {!lottieLoaded && (
        <div style={{ width, height }} className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Border with Segment Gaps */}
            <path
              d="M 310 60 L 644 60 A 26 26 0 0 1 670 86 L 670 414 A 26 26 0 0 1 644 440 L 400 440"
              stroke="#14454F"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 370 440 L 156 440 A 26 26 0 0 1 130 414 L 130 86 A 26 26 0 0 1 156 60 L 280 60"
              stroke="#14454F"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner Decorative Scalloped Border */}
            <path
              d="M 160 112 A 22 22 0 0 0 182 90 L 618 90 A 22 22 0 0 0 640 112 L 640 388 A 22 22 0 0 0 618 410 L 182 410 A 22 22 0 0 0 160 388 Z"
              stroke="#14454F"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Header Title Pill */}
            <rect x="330" y="146" width="140" height="18" rx="9" fill="#14454F" />

            {/* Mint Document Lines */}
            <rect x="235" y="207" width="330" height="16" rx="8" fill="#D6F0E2" />
            <rect x="235" y="257" width="330" height="16" rx="8" fill="#D6F0E2" />
            <rect x="235" y="307" width="160" height="16" rx="8" fill="#D6F0E2" />

            {/* Animated Laser Beam */}
            <g className="animate-[laserSweep_2.6s_ease-in-out_infinite_alternate]">
              {/* Laser Soft Glow */}
              <rect x="30" y="52" width="740" height="40" rx="20" fill="#3DAD64" fillOpacity="0.3" />
              {/* Laser Beam Bar */}
              <rect x="30" y="60" width="740" height="24" rx="12" fill="#3DAD64" />
            </g>
          </svg>
        </div>
      )}

      {/* Optional Status Badge */}
      {showStatusBadge && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-pulse">
          <span className="size-2 rounded-full bg-emerald-500" />
          {statusText}
        </div>
      )}

      <style jsx global>{`
        @keyframes laserSweep {
          0% {
            transform: translateY(18px);
          }
          100% {
            transform: translateY(352px);
          }
        }
      `}</style>
    </div>
  )
}
