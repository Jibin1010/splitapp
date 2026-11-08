'use client'

import * as React from 'react'
import type { Bill, CalculationResult } from '@/types/split'

export interface ArrowPath {
  key: string
  d: string
  badgeX: number
  badgeY: number
  amount: number
  fromName: string
  toName: string
}

export function useSettlementArrows(
  bill: Bill,
  activeResult: CalculationResult,
  displayNodesKey: string
) {
  const graphContainerRef = React.useRef<HTMLDivElement>(null)
  const [arrowPaths, setArrowPaths] = React.useState<ArrowPath[]>([])

  const personOf = (id: string) => bill.people.find((p) => p.id === id)

  React.useEffect(() => {
    if (!activeResult || activeResult.settlements.length === 0) {
      setArrowPaths((prev) => (prev.length === 0 ? prev : []))
      return
    }

    const updateArrows = () => {
      const container = graphContainerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      if (containerRect.width === 0 || containerRect.height === 0) {
        setArrowPaths((prev) => (prev.length === 0 ? prev : []))
        return
      }

      const newPaths: ArrowPath[] = []

      activeResult.settlements.forEach((s, idx) => {
        const fromEl = document.getElementById(`tail-node-${s.fromPersonId}`)
        const toEl = document.getElementById(`head-node-${s.toPersonId}`)

        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect()
          const toRect = toEl.getBoundingClientRect()

          const sameTailSettlements = activeResult.settlements.filter((item) => item.fromPersonId === s.fromPersonId)
          const tailIndex = sameTailSettlements.findIndex((item) => item.toPersonId === s.toPersonId)
          const tailCount = sameTailSettlements.length
          const tailOffset = tailCount > 1 ? (tailIndex - (tailCount - 1) / 2) * 28 : 0

          const x1 = fromRect.left + fromRect.width / 2 - containerRect.left + tailOffset
          const y1 = fromRect.top - containerRect.top

          const sameHeadSettlements = activeResult.settlements.filter((item) => item.toPersonId === s.toPersonId)
          const headIndex = sameHeadSettlements.findIndex((item) => item.fromPersonId === s.fromPersonId)
          const count = sameHeadSettlements.length
          const offset = count > 1 ? (headIndex - (count - 1) / 2) * 32 : 0

          const x2 = toRect.left + toRect.width / 2 - containerRect.left + offset
          const y2 = toRect.bottom - containerRect.top + 6

          const deltaY = Math.abs(y1 - y2)
          const cp1x = x1
          const cp1y = y1 - deltaY * 0.45
          const cp2x = x2
          const cp2y = y2 + deltaY * 0.45

          const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`

          const t = 0.5
          const midX =
            Math.pow(1 - t, 3) * x1 +
            3 * Math.pow(1 - t, 2) * t * cp1x +
            3 * (1 - t) * Math.pow(t, 2) * cp2x +
            Math.pow(t, 3) * x2
          const midY =
            Math.pow(1 - t, 3) * y1 +
            3 * Math.pow(1 - t, 2) * t * cp1y +
            3 * (1 - t) * Math.pow(t, 2) * cp2y +
            Math.pow(t, 3) * y2

          const fromP = personOf(s.fromPersonId)
          const toP = personOf(s.toPersonId)

          newPaths.push({
            key: `${s.fromPersonId}-${s.toPersonId}-${idx}`,
            d,
            badgeX: midX,
            badgeY: midY,
            amount: s.amount,
            fromName: fromP?.name || 'Someone',
            toName: toP?.name || 'Head',
          })
        }
      })

      setArrowPaths((prev) => {
        if (prev.length !== newPaths.length) return newPaths
        const isSame = prev.every(
          (p, i) =>
            p.key === newPaths[i].key &&
            Math.abs(p.badgeX - newPaths[i].badgeX) < 1 &&
            Math.abs(p.badgeY - newPaths[i].badgeY) < 1 &&
            p.amount === newPaths[i].amount
        )
        return isSame ? prev : newPaths
      })
    }

    const timer = setTimeout(updateArrows, 60)
    window.addEventListener('resize', updateArrows)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && graphContainerRef.current) {
      observer = new ResizeObserver(() => updateArrows())
      observer.observe(graphContainerRef.current)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateArrows)
      if (observer) observer.disconnect()
    }
  }, [activeResult?.settlements, bill.people, bill.headTailPreferences, displayNodesKey])

  return { graphContainerRef, arrowPaths, personOf }
}
