/**
 * Zero-Knowledge Client-Side Vault Cryptography (AES-256-GCM)
 *
 * Implements authenticated military-grade envelope encryption:
 * 1. Encrypts receipt photos before they leave the client device.
 * 2. Uploads only scrambled ciphertext to Google Drive (unreadable to Google & outsiders).
 * 3. Requires the group decryption key to unlock.
 * 4. Fails cryptographically if ciphertext or IV is tampered with (Auth Tag verification).
 */

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto
  }
  throw new Error('Web Cryptography API is not available in this environment')
}

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Generates a cryptographically secure 256-bit AES-GCM symmetric key.
 */
export async function generateVaultKey(): Promise<string> {
  const cryptoObj = getCrypto()
  const key = await cryptoObj.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = await cryptoObj.subtle.exportKey('raw', key)
  return uint8ArrayToBase64(new Uint8Array(raw))
}

/**
 * Encrypts arbitrary file data or image bytes using AES-256-GCM.
 * Generates a unique 12-byte Initialization Vector (IV) for every encryption.
 */
export async function encryptReceipt(
  plaintextBuffer: ArrayBuffer | Uint8Array,
  keyBase64: string
): Promise<{
  ciphertextBuffer: ArrayBuffer
  ivBase64: string
  authTagValid: boolean
}> {
  const cryptoObj = getCrypto()
  const keyBytes = base64ToUint8Array(keyBase64)

  const cryptoKey = await cryptoObj.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  // 12-byte IV standard for AES-GCM
  const iv = cryptoObj.getRandomValues(new Uint8Array(12))

  const ciphertext = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128, // 16-byte authentication tag
    },
    cryptoKey,
    plaintextBuffer as unknown as BufferSource
  )

  return {
    ciphertextBuffer: ciphertext,
    ivBase64: uint8ArrayToBase64(iv),
    authTagValid: true,
  }
}

/**
 * Decrypts AES-256-GCM ciphertext using the group key and IV.
 * Throws an error if the key is incorrect or if the ciphertext was tampered with.
 */
export async function decryptReceipt(
  ciphertextBuffer: ArrayBuffer | Uint8Array,
  ivBase64: string,
  keyBase64: string
): Promise<ArrayBuffer> {
  const cryptoObj = getCrypto()
  const keyBytes = base64ToUint8Array(keyBase64)
  const ivBytes = base64ToUint8Array(ivBase64)

  const cryptoKey = await cryptoObj.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const decrypted = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
      tagLength: 128,
    },
    cryptoKey,
    ciphertextBuffer as unknown as BufferSource
  )

  return decrypted
}

/**
 * Converts a browser Blob or File into an ArrayBuffer.
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (blob.arrayBuffer) {
    return blob.arrayBuffer()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Converts a decrypted ArrayBuffer into a memory-only Blob Object URL for display.
 */
export function createDecryptedObjectUrl(
  decryptedBuffer: ArrayBuffer,
  mimeType: string = 'image/jpeg'
): { objectUrl: string; revoke: () => void } {
  if (typeof window === 'undefined' || !window.URL) {
    return { objectUrl: '', revoke: () => {} }
  }
  const blob = new Blob([decryptedBuffer], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  return {
    objectUrl,
    revoke: () => URL.revokeObjectURL(objectUrl),
  }
}

