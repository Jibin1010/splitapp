'use client'

import * as React from 'react'
import { CheckSquare, LayoutGrid, Plus, Receipt, Sparkles, Trash2 } from 'lucide-react'
import type { ProductItem } from '@/types/split'
import { billTotalsOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { newId } from '@/lib/id'
import { useBillStore } from '@/lib/store'
import { AllocationDialog } from '@/components/forms/allocation-dialog'
import { cn } from '@/lib/utils'
import { ProductDesktopTable } from './products/product-desktop-table'
import { ProductMobileCards } from './products/product-mobile-cards'
import { AdjustmentsSection } from './products/adjustments-list'
import { ProductEmptyState } from './products/product-empty-state'
import { ProductDeleteDialogs } from './products/product-delete-dialogs'

interface ProductsTableProps {
  onOpenVision?: () => void
}

export function ProductsTable({ onOpenVision }: ProductsTableProps = {}) {
  const { state, dispatch, preview, activePerson, getItemShareForActivePerson, isItemAssignedToActivePerson } = useBillStore()
  const bill = state.bill
  const totals = billTotalsOf(bill)

  const [assignmentItemId, setAssignmentItemId] = React.useState<string | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<ProductItem | null>(null)
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = React.useState(false)

  // Identify Head User: fronted payment or creator
  const isHeadUser = React.useMemo(() => {
    if (!activePerson) return true
    if ((activePerson.paidAmount || 0) > 0) return true
    const anyonePaid = bill.people.some((p) => (p.paidAmount || 0) > 0)
    if (!anyonePaid && bill.people.length > 0 && bill.people[0].id === activePerson.id) return true
    return false
  }, [activePerson, bill.people])

  // Items assigned to active person
  const userItems = React.useMemo(() => {
    if (!activePerson) return bill.items
    return bill.items.filter((item) => isItemAssignedToActivePerson(item.id))
  }, [activePerson, bill.items, isItemAssignedToActivePerson])

  // View mode: 'all' or 'user'
  const [userSelectedMode, setUserSelectedMode] = React.useState<'user' | 'all' | null>(null)

  // Reset selected mode when active user perspective changes
  const prevActivePersonIdRef = React.useRef(activePerson?.id)
  React.useEffect(() => {
    if (prevActivePersonIdRef.current !== activePerson?.id) {
      prevActivePersonIdRef.current = activePerson?.id
      setUserSelectedMode(null)
    }
  }, [activePerson?.id])

  // Default to 'all' so complete details are visible matching the design screenshot
  const effectiveMode = userSelectedMode ?? 'all'

  // Calculate active person's financial share breakdown
  const pRes = activePerson ? preview.people[activePerson.id] : null
  const userItemsShare = React.useMemo(() => {
    if (!pRes) return 0
    return Object.values(pRes.itemContributions || {}).reduce((a, b) => a + b, 0)
  }, [pRes])
  const userTotalShare = pRes?.share ?? 0
  const userAdjustmentShare = Math.max(0, userTotalShare - userItemsShare)

  const displayedItems = effectiveMode === 'user' ? userItems : bill.items
  const assignmentTarget = bill.items.find((item) => item.id === assignmentItemId) ?? null
  const totalQuantity = bill.items.reduce((sum, item) => sum + item.quantity, 0)
  const userQuantity = userItems.reduce((sum, item) => sum + item.quantity, 0)

  const openAssignment = (itemId: string) => setAssignmentItemId(itemId)

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId })
    setDeleteItem(null)
  }

  const handleDuplicate = (itemId: string) => {
    dispatch({ type: 'DUPLICATE_ITEM', itemId })
  }

  const handleAddAdjustment = () => {
    dispatch({
      type: 'ADD_ADJUSTMENT',
      adjustment: { id: newId('adj'), label: 'Service charge', kind: 'service_charge', method: 'percent', value: 10 },
    })
  }

  const handleAddProduct = () => {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id: newId('item'),
        name: '',
        quantity: 1,
        unitPrice: 0,
        allocation: { mode: 'equal', participantIds: bill.people.map((p) => p.id) },
      },
    })
  }

  return (
    <div id="products-section" className="space-y-3">
      {/* Main Products & Prices Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs p-4 sm:p-6 transition-all">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Left: Icon Box + Title + Badge + Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#4F46E5] text-white shadow-sm shadow-indigo-500/25">
              <Receipt className="size-5" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Products &amp; prices
                </h2>
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5]">
                  {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter every item first — totals update as you type.
              </p>
            </div>
          </div>

          {/* Right: Action Pills */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            {/* 1. What You Bought (N) */}
            <button
              type="button"
              onClick={() => setUserSelectedMode('user')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs transition-all cursor-pointer',
                effectiveMode === 'user'
                  ? 'border-indigo-500 bg-indigo-50/30 text-[#4F46E5] font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <CheckSquare className="size-3.5" />
              <span>What You Bought ({userItems.length})</span>
            </button>

            {/* 2. Complete Details (N) */}
            <button
              type="button"
              onClick={() => setUserSelectedMode('all')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs transition-all cursor-pointer',
                effectiveMode === 'all'
                  ? 'border-indigo-500 bg-indigo-50/20 text-[#4F46E5] font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>Complete Details ({bill.items.length})</span>
            </button>

            {/* 3. Clear all */}
            {bill.items.length > 0 && (
              <button
                type="button"
                onClick={() => setClearAllConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Clear all</span>
              </button>
            )}

            {/* 4. AI Scan / Describe */}
            {onOpenVision && (
              <button
                type="button"
                onClick={onOpenVision}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-[#4F46E5] hover:bg-indigo-50/70 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="size-3.5 text-indigo-500" />
                <span>AI Scan / Describe</span>
              </button>
            )}

            {/* 5. + Add Product */}
            <button
              type="button"
              onClick={handleAddProduct}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F46E5] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="pt-2">
          {bill.items.length === 0 ? (
            <ProductEmptyState
              type="no-products"
              isHeadUser={isHeadUser}
              onOpenVision={onOpenVision}
            />
          ) : effectiveMode === 'user' && displayedItems.length === 0 ? (
            <ProductEmptyState
              type="no-user-items"
              activePersonName={activePerson?.name}
              totalItemsCount={bill.items.length}
              onSwitchToAll={() => setUserSelectedMode('all')}
            />
          ) : (
            <>
              <ProductDesktopTable
                bill={bill}
                displayedItems={displayedItems}
                effectiveMode={effectiveMode}
                isHeadUser={isHeadUser}
                activePerson={activePerson}
                totals={totals}
                totalQuantity={totalQuantity}
                userQuantity={userQuantity}
                userItemsShare={userItemsShare}
                userAdjustmentShare={userAdjustmentShare}
                userTotalShare={userTotalShare}
                isItemAssignedToActivePerson={isItemAssignedToActivePerson}
                getItemShareForActivePerson={getItemShareForActivePerson}
                onOpenAssignment={openAssignment}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteItem}
              />

              <ProductMobileCards
                bill={bill}
                displayedItems={displayedItems}
                effectiveMode={effectiveMode}
                isHeadUser={isHeadUser}
                activePerson={activePerson}
                totals={totals}
                totalQuantity={totalQuantity}
                userQuantity={userQuantity}
                userItemsShare={userItemsShare}
                userAdjustmentShare={userAdjustmentShare}
                userTotalShare={userTotalShare}
                isItemAssignedToActivePerson={isItemAssignedToActivePerson}
                getItemShareForActivePerson={getItemShareForActivePerson}
                onOpenAssignment={openAssignment}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteItem}
              />
            </>
          )}
        </div>
      </div>

      {/* Adjustments (Optional) Accordion Card */}
      <AdjustmentsSection
        adjustments={bill.adjustments}
        totals={totals}
        currency={bill.currency}
        isHeadUser={isHeadUser}
        onAddAdjustment={handleAddAdjustment}
      />

      {/* Advanced Assignment & Custom Mode Editor Dialog */}
      <AllocationDialog
        item={assignmentTarget}
        open={assignmentTarget !== null}
        onOpenChange={(open) => !open && setAssignmentItemId(null)}
      />

      {/* Delete & Clear all confirmation dialogs */}
      <ProductDeleteDialogs
        deleteItem={deleteItem}
        onCloseDelete={() => setDeleteItem(null)}
        onConfirmDelete={removeItem}
        clearAllConfirmOpen={clearAllConfirmOpen}
        onCloseClearAll={() => setClearAllConfirmOpen(false)}
        onConfirmClearAll={() => {
          dispatch({ type: 'CLEAR_ALL_ITEMS' })
          setClearAllConfirmOpen(false)
        }}
        totalItemsCount={bill.items.length}
      />
    </div>
  )
}
