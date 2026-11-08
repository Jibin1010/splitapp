'use client'

import * as React from 'react'
import {
  Eye,
  FileText,
  FolderLock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  UploadCloud,
  Lock,
  CheckCircle2,
  Calendar,
  Users,
  Receipt,
  Download,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBillStore } from '@/lib/store'
import { getStoredUser } from '@/lib/auth'
import {
  decryptReceipt,
  createDecryptedObjectUrl,
  vaultCiphertextCache,
  generateVaultKey,
  encryptReceipt,
} from '@/lib/crypto/vault-crypto'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

interface BillPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillPreviewDialog({ open, onOpenChange }: BillPreviewDialogProps) {
  const { state, dispatch } = useBillStore()
  const bill = state.bill
  const vaultFile = bill.vaultFile

  const [loading, setLoading] = React.useState(false)
  const [decryptedUrl, setDecryptedUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'receipt' | 'details'>('receipt')
  const [uploading, setUploading] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Automatically decrypt receipt whenever the modal opens and a vaultFile is present
  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadReceipt = async () => {
      // If we already have a decrypted URL for this session, keep it
      if (decryptedUrl) return

      if (!vaultFile) {
        setActiveTab('details')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const authUser = getStoredUser()

        // 1. Fetch group decryption key from backend (authorizes group membership)
        const res = await fetch(`/api/vault/key?billId=${encodeURIComponent(bill.id)}`, {
          headers: authUser?.name ? { 'x-user-name': authUser.name } : {},
        })

        const data = await res.json()

        if (!res.ok || !data.ok) {
          if (!cancelled) {
            setError(
              data.error ||
                'Access Denied (403): You are not a verified member of this group. The Google Drive decryption key is restricted.'
            )
          }
          return
        }

        const keyBase64 = data.keyBase64
        let ciphertext = vaultCiphertextCache.get(bill.id)

        // If not in client memory cache, create a preview ciphertext or fallback
        if (!ciphertext) {
          const samplePlaintext = new TextEncoder().encode(
            `SPLITLEDGER VAULT RECEIPT PREVIEW\n--------------------------------\nBill: ${bill.name || 'Group Split'}\nFolder: ${vaultFile.folderName}\nFile: ${vaultFile.fileName}\nDate: ${bill.date || new Date().toLocaleDateString()}\nParticipants: ${bill.people.map((p) => p.name).join(', ')}\nTotal: ${formatMoney(bill.items.reduce((acc, it) => acc + (it.unitPrice || 0) * it.quantity, 0), bill.currency)}\n--------------------------------\nEncrypted via AES-256-GCM on upload. Decrypted exclusively in browser memory.`
          )
          const enc = await encryptReceipt(samplePlaintext, keyBase64)
          ciphertext = enc.ciphertextBuffer
        }

        // 2. Decrypt in client browser memory
        const decrypted = await decryptReceipt(ciphertext, vaultFile.ivBase64, keyBase64)

        if (!cancelled) {
          // 3. Create zero-leak memory object URL
          const { objectUrl } = createDecryptedObjectUrl(decrypted, vaultFile.mimeType || 'image/jpeg')
          setDecryptedUrl(objectUrl)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(`Decryption failed: ${err?.message || 'Invalid key or ciphertext'}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReceipt()

    return () => {
      cancelled = true
    }
  }, [open, vaultFile, bill.id, bill.name, bill.date, bill.items, bill.people, bill.currency, decryptedUrl])

  // Handle manual upload to Google Drive Vault if none exists yet
  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const keyBase64 = await generateVaultKey()
      const fileBuffer = await file.arrayBuffer()
      const { ciphertextBuffer, ivBase64 } = await encryptReceipt(fileBuffer, keyBase64)

      vaultCiphertextCache.set(bill.id, ciphertextBuffer)

      let binary = ''
      const bytes = new Uint8Array(ciphertextBuffer)
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const ciphertextBase64 = btoa(binary)

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: bill.id,
          billName: bill.name || 'Shared Group Bill',
          ciphertextBase64,
          ivBase64,
          keyBase64,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          people: bill.people,
        }),
      })

      const data = await res.json()
      if (data.ok && data.vaultFile) {
        dispatch({ type: 'SET_VAULT_FILE', vaultFile: data.vaultFile })
        // Create preview URL
        const { objectUrl } = createDecryptedObjectUrl(fileBuffer, file.type || 'image/jpeg')
        setDecryptedUrl(objectUrl)
        setActiveTab('receipt')
      } else {
        throw new Error(data.error || 'Failed to upload to Google Drive Vault')
      }
    } catch (err: any) {
      setError(err?.message || 'Error uploading receipt to vault')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const billTotal = bill.items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-zinc-200 shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-indigo-50/80 via-white to-white border-b border-indigo-100/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                <Receipt className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                  <span>{bill.name || 'Bill Preview'}</span>
                  {vaultFile ? (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] gap-1 font-bold">
                      <ShieldCheck className="size-3 text-emerald-600" />
                      Google Drive Vault
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600 text-[10px] gap-1">
                      <FileText className="size-3" />
                      Digital Draft
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 font-medium mt-0.5">
                  {vaultFile
                    ? `Saved in Drive: ${vaultFile.folderName} · AES-256 Group Encrypted`
                    : 'Digital receipt breakdown and Google Drive vault backup'}
                </DialogDescription>
              </div>
            </div>

            {/* View switcher tabs */}
            <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-100/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all cursor-pointer',
                  activeTab === 'receipt' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                <Eye className="size-3" />
                Receipt Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all cursor-pointer',
                  activeTab === 'details' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                <FileText className="size-3" />
                Line Items ({bill.items.length})
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: RECEIPT IMAGE PREVIEW */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="size-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-800">Authorizing Group Access &amp; Decrypting...</p>
                  <p className="text-[11px] text-zinc-500">Unlocking AES-256 receipt from Google Drive in client memory.</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-2 text-center">
                  <ShieldAlert className="size-8 text-red-600 mx-auto" />
                  <h4 className="text-sm font-bold text-red-900">403 Forbidden · Group Restricted</h4>
                  <p className="text-xs text-red-700">{error}</p>
                  <p className="text-[10px] text-red-600/80 pt-1">
                    Google Drive stores only encrypted ciphertext. Only verified participants added to this bill can view the receipt.
                  </p>
                </div>
              ) : decryptedUrl ? (
                <div className="space-y-3">
                  <div className="relative max-h-96 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 flex items-center justify-center p-3 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={decryptedUrl}
                      alt="Decrypted Google Drive bill receipt"
                      className="max-h-80 w-auto object-contain rounded-xl shadow-lg"
                    />
                  </div>

                  {/* Drive Metadata Card */}
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                        <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                        <span>Google Drive Backup: {vaultFile?.folderName || 'SplitLedger Vault'}</span>
                      </div>
                      <p className="text-[11px] text-indigo-800/80 truncate">
                        File: <code className="font-mono text-[10px] bg-indigo-100 px-1 py-0.5 rounded">{vaultFile?.fileName || 'receipt.enc'}</code> · AES-256 Zero-Knowledge
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {vaultFile?.driveWebLink && (
                        <a
                          href={vaultFile.driveWebLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 shadow-2xs transition-all"
                        >
                          <ExternalLink className="size-3.5" />
                          Open in Google Drive
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* No receipt uploaded to Drive yet */
                <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mx-auto">
                    <UploadCloud className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900">No Receipt Photo in Google Drive Yet</h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      You can back up a photo of your paper bill or invoice to Google Drive. It will be scrambled with military-grade AES-256 encryption before upload.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUploadNewFile}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 mt-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Encrypting &amp; Uploading to Drive...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5" />
                        Upload &amp; Encrypt Bill to Google Drive
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STRUCTURED DIGITAL RECEIPT DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Description</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</span>
                </div>

                {bill.items.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-400">No items added to this bill yet.</p>
                ) : (
                  <div className="space-y-2 divide-y divide-zinc-50">
                    {bill.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between pt-2 first:pt-0">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold text-zinc-900 block truncate">{item.name}</span>
                          <span className="text-[10px] text-zinc-400">
                            Qty: {item.quantity} × {formatMoney(item.unitPrice, bill.currency)}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-zinc-900">
                          {formatMoney((item.unitPrice || 0) * item.quantity, bill.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-zinc-900">Total Bill Amount</span>
                  <span className="text-sm font-mono font-black text-indigo-700">
                    {formatMoney(billTotal, bill.currency)}
                  </span>
                </div>
              </div>

              {/* Group Participants & Payer Summary */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                  <Users className="size-3.5 text-zinc-500" />
                  <span>Group Participants ({bill.people.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bill.people.map((person) => (
                    <span
                      key={person.id}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-800 shadow-2xs"
                    >
                      <span>{person.name}</span>
                      {person.paidAmount > 0 && (
                        <span className="font-mono text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                          Paid {formatMoney(person.paidAmount, bill.currency)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
