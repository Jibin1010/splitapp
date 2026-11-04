import { NextResponse } from 'next/server'
import { phoneVerification } from '@/lib/phone-verification/service'

const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

/**
 * GET Handler: Telegram Webhook Diagnostic & Health Check.
 */
export async function GET() {
  const isBotConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN)
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    'SplitAppVerifyBot'

  return NextResponse.json({
    status: 'ok',
    service: 'SplitApp Telegram Contact Verification Webhook',
    botConfigured: isBotConfigured,
    botUsername,
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST Handler: Processes incoming Telegram Webhook updates & Test Simulations.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify Secret Token Header if configured
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
      if (secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized secret token' },
          { status: 401 }
        )
      }
    }

    const body = await request.json().catch(() => ({}))

    // 2. Simulator mode for testing without real Telegram webhook
    if (body.simulate === true && body.challengeId) {
      const simResult = await phoneVerification.simulateTelegramContact({
        challengeId: body.challengeId,
        actualPhone: body.actualPhone,
        simulateMismatch: Boolean(body.simulateMismatch),
      })
      return NextResponse.json({ ok: simResult.success, ...simResult })
    }

    // 3. Process live Telegram update
    const result = await phoneVerification.processTelegramUpdate(body)

    // Telegram Bot API always requires HTTP 200 OK acknowledgment
    return NextResponse.json({ ok: true, result }, { status: 200 })
  } catch (error: any) {
    console.error('Telegram webhook processing error:', error?.message)
    // Return 200 to Telegram even on non-fatal error so it doesn't repeatedly retry
    return NextResponse.json(
      { ok: true, error: error?.message || 'Handled with internal error' },
      { status: 200 }
    )
  }
}

