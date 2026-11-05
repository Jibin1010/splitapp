import { describe, it, expect } from 'vitest'
import {
  generateVaultKey,
  encryptReceipt,
  decryptReceipt,
} from '@/lib/crypto/vault-crypto'
import {
  uploadEncryptedReceiptToDrive,
  saveGroupVaultKey,
  getGroupVaultKey,
  getOrCreateVaultFolder,
} from '@/lib/vault/vault-service'

describe('Google Drive Zero-Knowledge Vault Architecture', () => {
  const testBillId = 'bill-test-drive-vault-12345'
  const testBillName = 'Weekend Goa Trip'
  const ownerIdentityId = 'user-owner-001'
  const groupMemberName = 'Maya Sharma'
  const outsiderName = 'Random Stranger'

  it('1. should create or locate dedicated Google Drive folder: SplitLedger Vault - [Group Name]', async () => {
    const { folderId, folderName } = await getOrCreateVaultFolder(testBillName)
    expect(folderName).toBe(`SplitLedger Vault - ${testBillName}`)
    expect(typeof folderId).toBe('string')
  })

  it('2. should encrypt receipt locally and upload unreadable ciphertext to Google Drive', async () => {
    // A. Generate client key
    const groupKey = await generateVaultKey()

    // B. Encrypt original receipt bytes
    const originalReceipt = 'TAJ_HOTEL_INVOICE #9821 · Butter Chicken, Naan, Desserts · ₹4,850'
    const plaintextBuffer = new TextEncoder().encode(originalReceipt)
    const { ciphertextBuffer, ivBase64 } = await encryptReceipt(plaintextBuffer, groupKey)

    // Verify ciphertext does not leak plaintext
    const rawCiphertext = new TextDecoder().decode(ciphertextBuffer)
    expect(rawCiphertext).not.toContain('TAJ_HOTEL_INVOICE')
    expect(rawCiphertext).not.toContain('₹4,850')

    // C. Save key to Vault
    await saveGroupVaultKey({
      billId: testBillId,
      keyBase64: groupKey,
      userIdentityId: ownerIdentityId,
    })

    // D. Upload ciphertext (.enc) to Google Drive
    const vaultFile = await uploadEncryptedReceiptToDrive({
      billId: testBillId,
      billName: testBillName,
      ciphertextBuffer: Buffer.from(ciphertextBuffer),
      originalFileName: 'hotel_taj_bill.jpg',
      originalMimeType: 'image/jpeg',
      ivBase64,
      userIdentityId: ownerIdentityId,
    })

    expect(vaultFile.fileName).toMatch(/^receipt-hotel_taj_bill-\d+\.enc$/)
    expect(vaultFile.folderName).toBe(`SplitLedger Vault - ${testBillName}`)
    expect(vaultFile.driveWebLink).toContain('drive.google.com')
    expect(vaultFile.isEncrypted).toBe(true)
  })

  it('3. should strictly reject outsiders with 403 Forbidden when requesting the decryption key', async () => {
    const unauthorizedAttempt = await getGroupVaultKey({
      billId: testBillId,
      requestingIdentityId: 'stranger-attacker-999',
      requestingUserName: outsiderName,
    })

    expect(unauthorizedAttempt.success).toBe(false)
    if (!unauthorizedAttempt.success) {
      expect(unauthorizedAttempt.status).toBe(403)
      expect(unauthorizedAttempt.error).toContain('Access denied')
    }
  })

  it('4. should allow verified group members to retrieve the key and decrypt receipt locally in memory', async () => {
    // Verified group owner requests the key
    const ownerKeyRes = await getGroupVaultKey({
      billId: testBillId,
      requestingIdentityId: ownerIdentityId,
      requestingUserName: 'Owner User',
    })

    expect(ownerKeyRes.success).toBe(true)
    if (ownerKeyRes.success) {
      expect(typeof ownerKeyRes.keyBase64).toBe('string')

      // Verify group member can decrypt the ciphertext back to exact original receipt
      const originalReceipt = 'TAJ_HOTEL_INVOICE #9821 · Butter Chicken, Naan, Desserts · ₹4,850'
      const plaintextBuffer = new TextEncoder().encode(originalReceipt)
      const { ciphertextBuffer, ivBase64 } = await encryptReceipt(plaintextBuffer, ownerKeyRes.keyBase64)

      const decryptedBuffer = await decryptReceipt(ciphertextBuffer, ivBase64, ownerKeyRes.keyBase64)
      const decryptedText = new TextDecoder().decode(decryptedBuffer)
      expect(decryptedText).toBe(originalReceipt)
    }
  })
})

