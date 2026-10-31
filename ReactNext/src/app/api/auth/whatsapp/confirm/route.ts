import { NextResponse } from 'next/server'
import { confirmSession, getWhatsAppSession } from '@/lib/whatsapp-auth'

export async function POST(request: Request) {
  try {
    const { sessionId, phone } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 })
    }

    const session = getWhatsAppSession(sessionId)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found or expired' }, { status: 404 })
    }

    confirmSession(sessionId, phone)

    return NextResponse.json({
      success: true,
      message: 'Session verified',
      sessionId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Confirmation failed' },
      { status: 500 }
    )
  }
}

