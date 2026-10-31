import { NextResponse } from 'next/server'
import { getWhatsAppSession } from '@/lib/whatsapp-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 })
  }

  const session = getWhatsAppSession(sessionId)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found or expired' }, { status: 404 })
  }

  if (session.status === 'VERIFIED') {
    const phone = session.verifiedPhone || session.phone || 'Verified WhatsApp User'
    return NextResponse.json({
      success: true,
      status: 'VERIFIED',
      user: {
        id: `wa-${session.code.toLowerCase()}`,
        name: `WhatsApp (${phone.slice(-4)})`,
        email: `${phone.replace(/[^0-9]/g, '')}@whatsapp.splitledger.app`,
        phone,
        photo: null,
      },
    })
  }

  return NextResponse.json({
    success: true,
    status: session.status,
  })
}

