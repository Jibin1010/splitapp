import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudSession } from '@/lib/supabase/db'
import { uploadEncryptedReceiptToDrive, saveGroupVaultKey } from '@/lib/vault/vault-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vault/upload
 *
 * Receives client-side AES-256 encrypted receipt ciphertext and:
 * 1. Uploads the .enc scrambled file to Google Drive folder: "SplitLedger Vault - [GroupName]".
 * 2. Saves the group decryption key in the database with strict group isolation.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cookieToken = req.cookies.get('cloud_session')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

    let userIdentityId: string | undefined
    if (token) {
      const session = await verifyCloudSession(token)
      if (session) userIdentityId = session.identityId
    }

    const body = await req.json()
    const {
      billId,
      billName,
      ciphertextBase64,
      ivBase64,
      keyBase64,
      fileName,
      mimeType,
      googleAccessToken,
    } = body

    if (!billId || !ciphertextBase64 || !ivBase64 || !keyBase64) {
      return NextResponse.json(
        { ok: false, error: 'Missing required vault encryption parameters' },
        { status: 400 }
      )
    }

    const ciphertextBuffer = Buffer.from(ciphertextBase64, 'base64')

    // 1. Save Group Decryption Key (Protected for group members only)
    await saveGroupVaultKey({
      billId,
      keyBase64,
      userIdentityId,
    })

    // 2. Upload Encrypted (.enc) file to Google Drive
    const vaultFile = await uploadEncryptedReceiptToDrive({
      billId,
      billName: billName || 'Shared Group Bill',
      ciphertextBuffer,
      originalFileName: fileName || 'receipt.jpg',
      originalMimeType: mimeType || 'image/jpeg',
      ivBase64,
      googleAccessToken,
      userIdentityId,
    })

    return NextResponse.json({
      ok: true,
      message: 'Receipt encrypted with AES-256 and uploaded to Google Drive Vault',
      vaultFile,
    })
  } catch (error: any) {
    console.error('Error in /api/vault/upload:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to upload to vault' },
      { status: 500 }
    )
  }
}

