import { NextResponse } from 'next/server'
import { verifySessionByCode } from '@/lib/whatsapp-auth'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'splitledger_wa_verify_secret'

/**
 * GET Handler: Meta WhatsApp Cloud API Webhook Verification Challenge.
 * Used when setting up the webhook in Meta App Dashboard -> WhatsApp -> Configuration.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

/**
 * POST Handler: Receives incoming messages from WhatsApp.
 * Supports:
 * 1. Meta WhatsApp Cloud API webhook structure
 * 2. Generic webhook: { from: "+91...", text: "Verify SPLIT-1234" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    let incomingText = ''
    let fromPhone = ''

    // 1. Meta Cloud API format
    const metaMessage = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (metaMessage) {
      fromPhone = metaMessage.from || ''
      if (metaMessage.type === 'text') {
        incomingText = metaMessage.text?.body || ''
      }
    }

    // 2. Fallback / Generic webhook format: { text: "...", from: "..." }
    if (!incomingText && body?.text) {
      incomingText = String(body.text)
      fromPhone = String(body.from || '')
    }

    // Search for code matching SPLIT-XXXX
    const codeMatch = incomingText.match(/SPLIT-\d{4}/i)
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase()
      const verifiedSession = verifySessionByCode(code, fromPhone)

      if (verifiedSession) {
        return NextResponse.json({
          success: true,
          matched: true,
          code,
          fromPhone,
          message: 'WhatsApp verification successful',
        })
      }
    }

    return NextResponse.json({
      success: true,
      matched: false,
      message: 'Webhook received, no pending session matched',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

