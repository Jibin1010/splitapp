import { describe, it, expect } from 'vitest'
import {
  generateVaultKey,
  encryptReceipt,
  decryptReceipt,
} from '@/lib/crypto/vault-crypto'

describe('Zero-Knowledge Vault Cryptography (AES-256-GCM)', () => {
  it('1. should generate a valid 256-bit base64 key', async () => {
    const key = await generateVaultKey()
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(30)
  })

  it('2. should encrypt and decrypt arbitrary image bytes with byte-for-byte fidelity', async () => {
    const key = await generateVaultKey()
    const originalText = 'SPLITLEDGER_RECEIPT_HEADER: Dinner at Taj, Total: ₹2,450'
    const encoder = new TextEncoder()
    const plaintext = encoder.encode(originalText)

    const { ciphertextBuffer, ivBase64 } = await encryptReceipt(plaintext, key)

    // Ciphertext must differ from plaintext
    expect(ciphertextBuffer.byteLength).toBeGreaterThan(plaintext.byteLength)
    const decoder = new TextDecoder()
    const rawCipherStr = decoder.decode(ciphertextBuffer)
    expect(rawCipherStr).not.toContain('Dinner at Taj') // unreadable!

    // Decrypt
    const decryptedBuffer = await decryptReceipt(ciphertextBuffer, ivBase64, key)
    const decryptedText = decoder.decode(decryptedBuffer)
    expect(decryptedText).toBe(originalText)
  })

  it('3. should reject decryption if an outsider uses the wrong key', async () => {
    const groupKey = await generateVaultKey()
    const strangerKey = await generateVaultKey()

    const plaintext = new TextEncoder().encode('Secret Receipt Image Bytes')
    const { ciphertextBuffer, ivBase64 } = await encryptReceipt(plaintext, groupKey)

    // Stranger tries to decrypt with their own key
    await expect(
      decryptReceipt(ciphertextBuffer, ivBase64, strangerKey)
    ).rejects.toThrow()
  })

  it('4. should detect ciphertext tampering and fail authentication tag check', async () => {
    const key = await generateVaultKey()
    const plaintext = new TextEncoder().encode('Legitimate Bill Receipt')
    const { ciphertextBuffer, ivBase64 } = await encryptReceipt(plaintext, key)

    // Tamper with a single byte in ciphertext
    const tampered = new Uint8Array(ciphertextBuffer.slice(0))
    tampered[5] = tampered[5] ^ 0xff

    await expect(
      decryptReceipt(tampered.buffer, ivBase64, key)
    ).rejects.toThrow()
  })
})

