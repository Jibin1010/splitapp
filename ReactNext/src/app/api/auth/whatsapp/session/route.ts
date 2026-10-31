import { NextResponse } from 'next/server'
import { createWhatsAppSession } from '@/lib/whatsapp-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = typeof body?.phone === 'string' ? body.phone : undefined

    const session = createWhatsAppSession(phone)

    // Configurable host/business WhatsApp number where users send the verification message
    const botNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER?.replace(/[^0-9]/g, '') ||
      '919876543210'

    const messageText = `Verify ${session.code}`
    const whatsappUrl = `https://wa.me/${botNumber}?text=${encodeURIComponent(messageText)}`

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      code: session.code,
      botNumber: process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '+91 98765 43210',
      whatsappUrl,
      expiresAt: session.expiresAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create WhatsApp session' },
      { status: 500 }
    )
  }
}

