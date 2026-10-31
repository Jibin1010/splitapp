'use client'

import * as React from 'react'
import {
  Package,
  Users,
  Trash2,
  Plus,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DialogPerson, EditableDetectedItem } from './vision-types'

interface VisionProductsTableProps {
  itemsList: EditableDetectedItem[]
  dialogPeople: DialogPerson[]
  onItemChange: (
    id: string,
    field: 'name' | 'quantity' | 'unitPriceRupees' | 'totalRupees',
    value: string | number
  ) => void
  onAddItem: () => void
  onDeleteItem: (id: string) => void
  onAssignAllToEveryone: () => void
  onRemoveAllProducts: () => void
  onTogglePersonForItem: (itemId: string, personId: string) => void
  onAssignAllForItem: (itemId: string) => void
}

export function VisionProductsTable({
  itemsList,
  dialogPeople,
  onItemChange,
  onAddItem,
  onDeleteItem,
  onAssignAllToEveryone,
  onRemoveAllProducts,
  onTogglePersonForItem,
  onAssignAllForItem,
}: VisionProductsTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
            <Package className="size-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Products ({itemsList.length}) &amp; Assignment
            </h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Verify extracted products, edit if needed, and assign to participants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAssignAllToEveryone}
            className="h-7 text-xs font-semibold gap-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Users className="size-3" />
            Assign all to everyone
          </Button>
          {itemsList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to remove all detected products?')) {
                  onRemoveAllProducts()
                }
              }}
              className="h-7 text-xs font-semibold gap-1 bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="size-3" />
              Remove All Products
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="h-7 text-xs font-semibold gap-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="size-3" /> Add Product
          </Button>
        </div>
      </div>

      {/* Products Interactive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
              <th className="py-2.5 px-3 text-left w-8">#</th>
              <th className="py-2.5 px-3 text-left min-w-44">Product Name</th>
              <th className="py-2.5 px-2 text-center w-20">Qty</th>
              <th className="py-2.5 px-2 text-right w-24">Price (₹)</th>
              <th className="py-2.5 px-2 text-right w-24">Total (₹)</th>
              <th className="py-2.5 px-3 text-left min-w-56">Assigned To</th>
              <th className="py-2.5 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {itemsList.map((item, index) => {
              const assigned = item.assignedParticipantIds || []

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 font-medium">{index + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {item.name.toLowerCase().includes('biryani') || item.name.toLowerCase().includes('chicken') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/images/production/dish-chicken-biryani.jpg"
                          alt="Chicken Biryani"
                          className="size-8 rounded-full object-cover border border-amber-300 shadow-xs shrink-0"
                        />
                      ) : item.name.toLowerCase().includes('meal') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/images/production/dish-meals-thali.jpg"
                          alt="Meals"
                          className="size-8 rounded-full object-cover border border-amber-300 shadow-xs shrink-0"
                        />
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold shadow-2xs">
                          <Package className="size-4 text-indigo-600" />
                        </span>
                      )}
                      <Input
                        value={item.name}
                        onChange={(e) => onItemChange(item.id, 'name', e.target.value)}
                        className="h-8 text-xs font-bold text-slate-900 bg-white border-slate-200 shadow-2xs"
                        placeholder="Product description"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onItemChange(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                        className="size-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-900 tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onItemChange(item.id, 'quantity', item.quantity + 1)}
                        className="size-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={(item.unitPricePaise / 100).toFixed(2)}
                      onChange={(e) => onItemChange(item.id, 'unitPriceRupees', e.target.value)}
                      className="h-8 text-xs text-right font-mono text-slate-800 bg-white border-slate-200 shadow-2xs"
                    />
                  </td>
                  <td className="py-2.5 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={(item.totalPaise / 100).toFixed(2)}
                      onChange={(e) => onItemChange(item.id, 'totalRupees', e.target.value)}
                      className="h-8 text-xs text-right font-mono font-bold text-slate-900 bg-white border-slate-200 shadow-2xs"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    {dialogPeople.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">
                        Add people in step 1 to assign
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {dialogPeople
                          .filter((person) => assigned.includes(person.id))
                          .slice(0, 3)
                          .map((person) => (
                            <span
                              key={person.id}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-2xs"
                            >
                              <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                              <span>{person.name}</span>
                              <button
                                type="button"
                                onClick={() => onTogglePersonForItem(item.id, person.id)}
                                className="text-slate-400 hover:text-red-600 rounded-full p-0.5"
                                title={`Unassign ${person.name}`}
                              >
                                <X className="size-2.5" />
                              </button>
                            </span>
                          ))}

                        {assigned.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5">
                            +{assigned.length - 3}
                          </span>
                        )}

                        {assigned.length === 0 && (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Not assigned
                          </span>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
                              title="Assign participants"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-white p-1 shadow-lg border border-slate-200">
                            <DropdownMenuItem
                              onClick={() => onAssignAllForItem(item.id)}
                              className="text-xs font-semibold cursor-pointer text-indigo-600"
                            >
                              <Users className="size-3.5 mr-1.5" />
                              Assign all ({dialogPeople.length})
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {dialogPeople.map((person) => {
                              const isSelected = assigned.includes(person.id)
                              return (
                                <DropdownMenuItem
                                  key={person.id}
                                  onClick={() => onTogglePersonForItem(item.id, person.id)}
                                  className="text-xs font-medium cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <PersonAvatar name={person.name} photo={person.photo} size="xs" />
                                    <span>{person.name}</span>
                                  </div>
                                  {isSelected && <Check className="size-3.5 text-indigo-600 stroke-[3]" />}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                      aria-label="Delete item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
