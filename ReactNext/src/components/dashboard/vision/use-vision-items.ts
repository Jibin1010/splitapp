'use client'

import * as React from 'react'
import { newId } from '@/lib/id'
import { getRandomAvatarForName } from '@/lib/dummy-people'
import { generateVaultKey, encryptReceipt, vaultCiphertextCache } from '@/lib/crypto/vault-crypto'
import type { Adjustment, ProductItem } from '@/types/split'
import type { DialogPerson, EditableDetectedItem, VisionApiResponse } from './vision-types'

interface UseVisionItemsParams {
  dialogPeople: DialogPerson[]
  setDialogPeople: React.Dispatch<React.SetStateAction<DialogPerson[]>>
  itemsList: EditableDetectedItem[]
  setItemsList: React.Dispatch<React.SetStateAction<EditableDetectedItem[]>>
  applyTax: boolean
  customGstRupees: number
  personGstShares: Record<string, number>
  result: VisionApiResponse | null
  headPersonIds: string[]
  headPaidAmounts: Record<string, number>
  tailHeadPreferences: Record<string, string>
  clearExistingBeforeImport: boolean
  dispatch: any
  calculate: () => Promise<any>
  onOpenChange: (open: boolean) => void
  setImported: (imported: boolean) => void
  imageSrc?: string | null
  imageName?: string
  state?: any
}

export function useVisionItems(params: UseVisionItemsParams) {
  const {
    dialogPeople,
    setDialogPeople,
    itemsList,
    setItemsList,
    applyTax,
    customGstRupees,
    personGstShares,
    result,
    headPersonIds,
    headPaidAmounts,
    tailHeadPreferences,
    clearExistingBeforeImport,
    dispatch,
    calculate,
    onOpenChange,
    setImported,
  } = params

  const handleItemChange = (
    id: string,
    field: 'name' | 'quantity' | 'unitPriceRupees' | 'totalRupees',
    value: string | number
  ) => {
    setItemsList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'name') return { ...item, name: String(value) }
        if (field === 'quantity') {
          const qty = Math.max(1, parseInt(String(value), 10) || 1)
          return { ...item, quantity: qty, totalPaise: Math.round(qty * item.unitPricePaise) }
        }
        if (field === 'unitPriceRupees') {
          const unitPricePaise = Math.round((parseFloat(String(value)) || 0) * 100)
          return { ...item, unitPricePaise, totalPaise: Math.round(item.quantity * unitPricePaise) }
        }
        if (field === 'totalRupees') {
          const totalPaise = Math.round((parseFloat(String(value)) || 0) * 100)
          const unitPricePaise = item.quantity > 0 ? Math.round(totalPaise / item.quantity) : totalPaise
          return { ...item, unitPricePaise, totalPaise }
        }
        return item
      })
    )
  }

  const handleAddItem = () => {
    setItemsList((prev) => [
      ...prev,
      {
        id: newId('item'),
        name: 'New Item',
        quantity: 1,
        unitPricePaise: 10000,
        totalPaise: 10000,
        assignedParticipantIds: dialogPeople.map((p) => p.id),
      },
    ])
  }

  const handleDeleteItem = (id: string) => {
    setItemsList((prev) => prev.filter((item) => item.id !== id))
  }

  const handleTogglePersonForItem = (itemId: string, personId: string) => {
    setItemsList((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const assigned = item.assignedParticipantIds || []
        const next = assigned.includes(personId)
          ? assigned.filter((id) => id !== personId)
          : [...assigned, personId]
        return { ...item, assignedParticipantIds: next }
      })
    )
  }

  const handleAssignAllForItem = (itemId: string) => {
    setItemsList((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return { ...item, assignedParticipantIds: dialogPeople.map((p) => p.id) }
      })
    )
  }

  const handleAssignAllToEveryone = () => {
    const allIds = dialogPeople.map((p) => p.id)
    setItemsList((prev) => prev.map((item) => ({ ...item, assignedParticipantIds: allIds })))
  }

  const handleAddPerson = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || dialogPeople.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return
    const newPerson: DialogPerson = {
      id: newId('person'),
      name: trimmed,
      photo: getRandomAvatarForName(trimmed),
      isNew: true,
    }
    setDialogPeople([...dialogPeople, newPerson])
  }

  const handleRemovePerson = (id: string) => {
    setDialogPeople((prev) => prev.filter((p) => p.id !== id))
    setItemsList((prev) =>
      prev.map((item) => ({
        ...item,
        assignedParticipantIds: (item.assignedParticipantIds || []).filter((pid) => pid !== id),
      }))
    )
  }

  const handleImportItems = () => {
    if (itemsList.length === 0) return

    const itemsToImport: ProductItem[] = itemsList.map((item) => ({
      id: newId('item'),
      name: item.name.trim() || 'Untitled product',
      quantity: Math.max(1, Math.round(item.quantity)),
      unitPrice: item.unitPricePaise,
      allocation: {
        mode: 'equal',
        participantIds: item.assignedParticipantIds || [],
      },
    }))

    const peopleToImport = dialogPeople.map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
    }))

    const adjustmentsToImport: Adjustment[] = []
    if (applyTax && customGstRupees > 0) {
      adjustmentsToImport.push({
        id: newId('adj'),
        kind: 'tax',
        label: 'GST (Bill Tax)',
        method: 'fixed',
        value: Math.round(customGstRupees * 100),
        shares: personGstShares && Object.keys(personGstShares).length > 0 ? personGstShares : undefined,
      })
    }

    const vendor = result?.vendor?.trim()
    const invoiceNumber = result?.invoiceNumber?.trim()
    const date = result?.date?.trim()
    const billName = vendor ? `${vendor}${invoiceNumber ? ` #${invoiceNumber}` : ''}` : undefined

    const activeHeads = headPersonIds.length > 0 ? headPersonIds : [dialogPeople[0]?.id].filter(Boolean)
    const headPayersToImport = activeHeads.map((hid) => ({
      personId: hid,
      amount: Math.round((headPaidAmounts[hid] || 0) * 100),
    }))

    const tailPrefsToImport: Record<string, string> = {}
    dialogPeople
      .filter((p) => !activeHeads.includes(p.id))
      .forEach((p) => {
        const preferred = tailHeadPreferences[p.id]
        if (preferred && activeHeads.includes(preferred)) {
          tailPrefsToImport[p.id] = preferred
        } else if (activeHeads.length > 0) {
          tailPrefsToImport[p.id] = activeHeads[0]
        }
      })

    dispatch({
      type: 'IMPORT_ANALYSIS_RESULT',
      items: itemsToImport,
      people: peopleToImport,
      adjustments: adjustmentsToImport,
      vendor,
      invoiceNumber,
      date,
      billName,
      headPayers: headPayersToImport,
      headTailPreferences: tailPrefsToImport,
      payerPersonId: activeHeads[0] || dialogPeople[0]?.id,
      replaceExistingItems: clearExistingBeforeImport,
      replaceExistingPeople: clearExistingBeforeImport && dialogPeople.length > 0,
    })

    // Zero-knowledge encryption & backup to Google Drive Vault
    if (params.imageSrc && params.state?.bill?.id) {
      const currentBillId = params.state.bill.id
      const finalBillName = billName || params.state.bill.name || 'Shared Group Bill'
      const originalName = params.imageName || 'receipt.jpg'
      const src = params.imageSrc

      void (async () => {
        try {
          const keyBase64 = await generateVaultKey()
          const res = await fetch(src)
          const buf = await res.arrayBuffer()
          const { ciphertextBuffer, ivBase64 } = await encryptReceipt(buf, keyBase64)
          vaultCiphertextCache.set(currentBillId, ciphertextBuffer)

          let binary = ''
          const bytes = new Uint8Array(ciphertextBuffer)
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const ciphertextBase64 = btoa(binary)

          const upRes = await fetch('/api/vault/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              billId: currentBillId,
              billName: finalBillName,
              ciphertextBase64,
              ivBase64,
              keyBase64,
              fileName: originalName,
              mimeType: 'image/jpeg',
              people: peopleToImport,
            }),
          })
          const upData = await upRes.json()
          if (upData.ok && upData.vaultFile) {
            dispatch({ type: 'SET_VAULT_FILE', vaultFile: upData.vaultFile })
          }
        } catch (vaultErr) {
          console.warn('Vault auto-upload notice:', vaultErr)
        }
      })()
    }

    setImported(true)
    onOpenChange(false)
    setTimeout(() => { void calculate() }, 100)
  }

  return {
    handleItemChange,
    handleAddItem,
    handleDeleteItem,
    handleTogglePersonForItem,
    handleAssignAllForItem,
    handleAssignAllToEveryone,
    handleAddPerson,
    handleRemovePerson,
    handleImportItems,
  }
}
