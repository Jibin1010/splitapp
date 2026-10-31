import { NextResponse } from 'next/server'
import { verifyMetaWebhookSignature } from '@/lib/phone-verification/crypto'
import { phoneVerification } from '@/lib/phone-verification/service'

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'splitledger_wa_verify_secret'
const META_APP_SECRET = process.env.META_APP_SECRET

/**
 * GET Handler: Meta WhatsApp Cloud API Webhook Handshake Verification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new Response('Forbidden', { status: 403 })
}

/**
 * POST Handler: Production Meta WhatsApp Cloud API Incoming Message Processor.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    // 1. Authenticate webhook signature if META_APP_SECRET is configured
    if (META_APP_SECRET) {
      const isValid = verifyMetaWebhookSignature(rawBody, signature, META_APP_SECRET)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid HMAC signature' },
          { status: 401 }
        )
      }
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 })
    }

    // 2. Extract messages from payload (Meta Cloud API standard format)
    const entries = payload?.entry || []
    let processedCount = 0

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value
        const messages = value?.messages || []

        for (const msg of messages) {
          if (msg.type === 'text') {
            const whatsappMessageId = msg.id || `msg_${Date.now()}`
            const senderNumber = msg.from || ''
            const text = msg.text?.body || ''

            await phoneVerification.processIncomingMessage({
              whatsappMessageId,
              senderNumber,
              text,
              rawPayload: msg,
            })
            processedCount++
          }
        }
      }
    }

    // 3. Fallback for custom webhook / test payloads: { messageId, from, text }
    if (processedCount === 0 && payload?.text && payload?.from) {
      const whatsappMessageId = payload.messageId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      await phoneVerification.processIncomingMessage({
        whatsappMessageId,
        senderNumber: String(payload.from),
        text: String(payload.text),
        rawPayload: payload,
      })
    }

    // Meta expects a prompt HTTP 200 OK to acknowledge receipt
    return NextResponse.json({ success: true, processed: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

