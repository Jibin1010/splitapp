'use client'

import * as React from 'react'
import {
  Copy,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react'
import type { Adjustment, AdjustmentKind, ProductItem } from '@/types/split'
import { assignedIdsOf, billTotalsOf, computeAdjustmentAmount, lineTotalOf } from '@/lib/calculations'
import { formatMoney } from '@/lib/money'
import { newId } from '@/lib/id'
import { useBillStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FloatInput, MoneyInput } from '@/components/ui/smart-input'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddProductButton, ProductNameInput, ProductQuantityInput, ProductUnitPriceInput } from '@/components/forms/product-form'
import { AllocationDialog } from '@/components/forms/allocation-dialog'
import { cn } from '@/lib/utils'

const MODE_LABELS: Record<ProductItem['allocation']['mode'], string> = {
  equal: 'Split equally',
  quantity: 'By quantity',
  custom: 'Custom amounts',
  percentage: 'Percentages',
}

function AssignedCell({ item, onOpen }: { item: ProductItem; onOpen: () => void }) {
  const { state } = useBillStore()
  const names = assignedIdsOf(item)
    .map((id) => state.bill.people.find((p) => p.id === id)?.name)
    .filter((name): name is string => Boolean(name))

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-9 max-w-xs min-w-28 flex-wrap items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Assigned people for ${item.name || 'product'} — open assignment editor`}
    >
      {names.length === 0 ? (
        <Badge variant="danger">
          <TriangleAlert aria-hidden />
          Unassigned
        </Badge>
      ) : (
        <>
          {names.slice(0, 3).map((name) => (
            <Badge key={name} variant="default">
              {name}
            </Badge>
          ))}
          {names.length > 3 && <Badge variant="secondary">+{names.length - 3}</Badge>}
        </>
      )}
    </button>
  )
}

function ModeCell({ item, onOpen }: { item: ProductItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="min-h-9 whitespace-nowrap rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Split mode for ${item.name || 'product'}: ${MODE_LABELS[item.allocation.mode]} — open assignment editor`}
    >
      {MODE_LABELS[item.allocation.mode]}
    </button>
  )
}

function AdjustmentRow({ adjustment }: { adjustment: Adjustment }) {
  const { state, dispatch } = useBillStore()
  const { itemsTotal } = billTotalsOf(state.bill)
  const amount = computeAdjustmentAmount(adjustment, itemsTotal)

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <Input
        value={adjustment.label}
        onChange={(event) =>
          dispatch({
            type: 'UPDATE_ADJUSTMENT',
            adjustmentId: adjustment.id,
            patch: { label: event.target.value.slice(0, 200) },
          })
        }
        aria-label="Adjustment label"
        className="h-9 min-w-32 flex-1"
      />
      <Select
        value={adjustment.kind}
        onValueChange={(kind) => dispatch({ type: 'UPDATE_ADJUSTMENT', adjustmentId: adjustment.id, patch: { kind: kind as AdjustmentKind } })}
      >
        <SelectTrigger className="h-9 w-36" aria-label="Adjustment kind">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="service_charge">Service charge</SelectItem>
          <SelectItem value="tax">Tax</SelectItem>
          <SelectItem value="discount">Discount</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={adjustment.method}
        onValueChange={(method) =>
          dispatch({
            type: 'UPDATE_ADJUSTMENT',
            adjustmentId: adjustment.id,
            patch: { method: method as 'percent' | 'fixed', value: method === 'percent' ? 10 : 0 },
          })
        }
      >
        <SelectTrigger className="h-9 w-28" aria-label="Adjustment method">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="percent">Percent</SelectItem>
          <SelectItem value="fixed">Fixed</SelectItem>
        </SelectContent>
      </Select>
      {adjustment.method === 'percent' ? (
        <FloatInput
          value={adjustment.value}
          onCommit={(value) => dispatch({ type: 'UPDATE_ADJUSTMENT', adjustmentId: adjustment.id, patch: { value } })}
          min={0}
          max={100}
          suffix="%"
          aria-label="Adjustment percentage"
          className="h-9 w-24"
        />
      ) : (
        <MoneyInput
          value={adjustment.value}
          onCommit={(value) => dispatch({ type: 'UPDATE_ADJUSTMENT', adjustmentId: adjustment.id, patch: { value } })}
          aria-label="Adjustment fixed amount"
          className="h-9 w-28"
        />
      )}
      <span
        className={cn(
          'w-24 text-right text-sm font-semibold tabular-nums',
          amount < 0 ? 'text-success' : 'text-foreground',
        )}
      >
        {formatMoney(amount, state.bill.currency)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => dispatch({ type: 'REMOVE_ADJUSTMENT', adjustmentId: adjustment.id })}
        aria-label={`Remove ${adjustment.label || 'adjustment'}`}
        className="text-muted-foreground hover:text-danger"
      >
        <Trash2 />
      </Button>
    </li>
  )
}

/**
 * The main workspace: an inline-editable product & price table (stacked
 * cards on small screens), bill-level adjustments, per-row assignment and
 * row actions (edit, duplicate, delete).
 */
export function ProductsTable({ onOpenVision }: { onOpenVision?: () => void } = {}) {
  const { state, dispatch } = useBillStore()
  const bill = state.bill
  const totals = billTotalsOf(bill)

  const [assignmentItemId, setAssignmentItemId] = React.useState<string | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<ProductItem | null>(null)

  const assignmentTarget = bill.items.find((item) => item.id === assignmentItemId) ?? null
  const totalQuantity = bill.items.reduce((sum, item) => sum + item.quantity, 0)

  const openAssignment = (itemId: string) => setAssignmentItemId(itemId)

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId })
    setDeleteItem(null)
  }

  const RowActions = ({ item }: { item: ProductItem }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={() => openAssignment(item.id)} aria-label={`Edit assignment for ${item.name || 'product'}`} className="hidden sm:inline-flex">
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => dispatch({ type: 'DUPLICATE_ITEM', itemId: item.id })}
        aria-label={`Duplicate ${item.name || 'product'}`}
        className="hidden sm:inline-flex"
      >
        <Copy />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteItem(item)}
        aria-label={`Delete ${item.name || 'product'}`}
        className="text-muted-foreground hover:text-danger"
      >
        <Trash2 />
      </Button>
    </div>
  )

  return (
    <Card id="products">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Products & prices</CardTitle>
          <CardDescription>Enter every item first — totals update as you type.</CardDescription>
        </div>
        <div className="flex items-center gap-2 no-print">
          {onOpenVision && (
            <Button
              variant="outline"
              onClick={onOpenVision}
              className="gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles className="size-4 text-primary" aria-hidden />
              AI Scan / Describe
            </Button>
          )}
          <AddProductButton />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {bill.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <Receipt className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">No products yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Add the first item from your bill — name, quantity and unit price. You can assign people to each
              product afterwards.
            </p>
            {onOpenVision && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenVision}
                className="mt-2 gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <Sparkles className="size-3.5 text-primary" aria-hidden />
                Upload Bill / Describe Image
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-2 py-2 font-medium">Product</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Quantity</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Unit Price</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Total</th>
                    <th scope="col" className="px-2 py-2 font-medium">Assigned To</th>
                    <th scope="col" className="px-2 py-2 font-medium">Split Mode</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item) => (
                    <tr key={item.id} className="group border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-2 py-1.5">
                        <ProductNameInput item={item} />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <ProductQuantityInput item={item} />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <ProductUnitPriceInput item={item} />
                      </td>
                      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                        {formatMoney(lineTotalOf(item), bill.currency)}
                      </td>
                      <td className="px-2 py-1.5">
                        <AssignedCell item={item} onOpen={() => openAssignment(item.id)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <ModeCell item={item} onOpen={() => openAssignment(item.id)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <RowActions item={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                    <td className="px-3 py-2.5 text-muted-foreground">Total</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{totalQuantity}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(totals.itemsTotal, bill.currency)}</td>
                    <td className="px-3 py-2.5" colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile stacked product cards */}
            <ul className="space-y-3 md:hidden">
              {bill.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-3">
                  <ProductNameInput item={item} />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Quantity</span>
                      <ProductQuantityInput item={item} className="w-full" />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Unit price</span>
                      <ProductUnitPriceInput item={item} className="w-full" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Line total</span>
                    <span className="font-semibold tabular-nums">{formatMoney(lineTotalOf(item), bill.currency)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AssignedCell item={item} onOpen={() => openAssignment(item.id)} />
                    <ModeCell item={item} onOpen={() => openAssignment(item.id)} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Button variant="secondary" size="sm" onClick={() => openAssignment(item.id)}>
                      <Users aria-hidden />
                      Assign people
                    </Button>
                    <RowActions item={item} />
                  </div>
                </li>
              ))}
              <li className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm font-semibold">
                <span className="text-muted-foreground">Items total ({totalQuantity} units)</span>
                <span className="tabular-nums">{formatMoney(totals.itemsTotal, bill.currency)}</span>
              </li>
            </ul>
          </>
        )}

        {/* Bill-level adjustments */}
        <section aria-label="Bill-level adjustments" className="space-y-1 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Adjustments (optional)</h3>
              <p className="text-xs text-muted-foreground">
                Service charge, tax or discount — applied to the items subtotal and split proportionally to
                everyone's share.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="no-print gap-1.5"
              onClick={() =>
                dispatch({
                  type: 'ADD_ADJUSTMENT',
                  adjustment: { id: newId('adj'), label: 'Service charge', kind: 'service_charge', method: 'percent', value: 10 },
                })
              }
            >
              <Plus aria-hidden />
              Add adjustment
            </Button>
          </div>

          {bill.adjustments.length > 0 && (
            <ul className="space-y-0.5">
              {bill.adjustments.map((adjustment) => (
                <AdjustmentRow key={adjustment.id} adjustment={adjustment} />
              ))}
              <li className="flex justify-end gap-2 pt-1 text-sm">
                <span className="text-muted-foreground">Adjustments total</span>
                <span className={cn('font-semibold tabular-nums', totals.adjustmentsTotal < 0 ? 'text-success' : 'text-foreground')}>
                  {formatMoney(totals.adjustmentsTotal, bill.currency)}
                </span>
              </li>
            </ul>
          )}
        </section>
      </CardContent>

      {/* Assignment editor */}
      <AllocationDialog item={assignmentTarget} open={assignmentTarget !== null} onOpenChange={(open) => !open && setAssignmentItemId(null)} />

      {/* Delete confirmation */}
      <Dialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleteItem?.name || 'Untitled product'}”?</DialogTitle>
            <DialogDescription>
              This removes the product and its assignment. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => deleteItem && removeItem(deleteItem.id)}>
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
