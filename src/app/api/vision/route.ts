import { NextResponse } from 'next/server'
import { parseReceiptResponse } from '@/lib/vision-parser'

export const runtime = 'nodejs'

interface VisionRequestBody {
  image?: string
  prompt?: string
  model?: string
}

async function callNvidiaModel(
  model: string,
  prompt: string,
  image: string,
  apiKey: string,
  apiBaseUrl: string,
  timeoutMs: number
) {
  const start = Date.now()
  const upstreamRes = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  const durationMs = Date.now() - start

  if (!upstreamRes.ok) {
    const errorText = await upstreamRes.text()
    throw new Error(`Model ${model} returned HTTP ${upstreamRes.status}: ${errorText}`)
  }

  const data = await upstreamRes.json()
  const description: string = data?.choices?.[0]?.message?.content || 'No description returned.'
  return { description, durationMs }
}

/**
 * POST /api/vision
 * Analyzes an image with vision models via NVIDIA NIM.
 * Returns exact raw OCR text first, and parsed items with quantity, unit price, and total.
 */
export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.NVIDIA_API_KEY
  const apiBaseUrl = process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1'

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'NVIDIA_API_KEY is not configured in server environment variables.',
        },
      },
      { status: 500 }
    )
  }

  let body: VisionRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON with an "image" field.',
        },
      },
      { status: 400 }
    )
  }

  const { image, prompt: userPrompt, model: requestedModel } = body
  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Please provide a valid base64 or URL image in the "image" field.',
        },
      },
      { status: 400 }
    )
  }

  const systemPrompt = `You are a precision OCR engine and receipt parsing specialist.
Analyze this receipt/bill image with absolute accuracy.

You MUST provide your response in two explicit parts:

PART 1: EXACT TRANSCRIBED TEXT (RAW OCR FIRST)
Transcribe EVERY line of text visible on this receipt from top to bottom exactly as printed.
Include store/restaurant name, address, phone number, GSTIN, dates, token numbers, table headers, item lines, quantities, unit prices, amounts, taxes, and totals verbatim with no omissions.
Enclose the exact text inside:
\`\`\`raw_text
[Exact verbatim transcription here]
\`\`\`

PART 2: STRUCTURED PRODUCTS & TOTALS (STRICT JSON)
Extract all purchased items/products into a strict JSON object.
CRITICAL RULES FOR PRODUCTS:
- "name": Clean item or dish name (e.g. "Chicken Biriyani", "Meals").
- "quantity": Number of units purchased (integer >= 1, e.g. 3, 1).
- "unit_price": Price per single unit in currency units (e.g. 180.00).
- "total": Line total for this item in currency units (e.g. 540.00).
- MATHEMATICAL INVARIANT: quantity * unit_price MUST EQUAL total (e.g. 3 * 180 = 540). NEVER confuse unit price with quantity!
- DO NOT list subtotal, CGST, SGST, GST, or Grand Total as products. Put them in the root fields.

Enclose the JSON inside:
\`\`\`json
{
  "vendor": "Restaurant or store name",
  "date": "Date if shown",
  "invoice_number": "Bill or token number",
  "items": [
    {
      "name": "Exact Item Name",
      "quantity": 3,
      "unit_price": 180.00,
      "total": 540.00
    }
  ],
  "subtotal": 660.00,
  "cgst": 16.50,
  "sgst": 16.50,
  "tax": 33.00,
  "grand_total": 693.00
}
\`\`\`
`

  const fullPrompt =
    userPrompt && userPrompt.trim().length > 0 && !userPrompt.includes('Transcribe')
      ? `${userPrompt.trim()}\n\n${systemPrompt}`
      : systemPrompt

  const primaryModel = requestedModel || process.env.NVIDIA_VISION_MODEL || 'meta/llama-3.2-11b-vision-instruct'
  const fallbackModel = 'google/diffusiongemma-26b-a4b-it'

  let activeModelUsed = primaryModel
  let fallbackUsed = false
  let description = ''
  let durationMs = 0

  // 1. Try Primary Model (give 35 seconds)
  try {
    const result = await callNvidiaModel(
      primaryModel,
      fullPrompt,
      image,
      apiKey,
      apiBaseUrl,
      35000
    )
    description = result.description
    durationMs = result.durationMs
  } catch (primaryError: unknown) {
    console.warn(`Primary model ${primaryModel} failed or timed out:`, primaryError)

    // Fallback model
    if (primaryModel !== fallbackModel) {
      try {
        console.log(`Failing over to vision model: ${fallbackModel}...`)
        const fallbackResult = await callNvidiaModel(
          fallbackModel,
          fullPrompt,
          image,
          apiKey,
          apiBaseUrl,
          45000
        )
        description = fallbackResult.description
        durationMs = fallbackResult.durationMs
        activeModelUsed = fallbackModel
        fallbackUsed = true
      } catch (fallbackError: unknown) {
        const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'ALL_MODELS_FAILED',
              message: `Vision analysis timed out on primary (${primaryModel}) and backup (${fallbackModel}): ${message}`,
            },
          },
          { status: 504 }
        )
      }
    } else {
      const message = primaryError instanceof Error ? primaryError.message : String(primaryError)
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'MODEL_ERROR',
            message: `Vision model failed: ${message}`,
          },
        },
        { status: 504 }
      )
    }
  }

  const parsed = parseReceiptResponse(description)

  return NextResponse.json({
    ok: true,
    model: activeModelUsed,
    fallbackUsed,
    durationMs,
    rawText: parsed.rawText,
    vendor: parsed.vendor,
    date: parsed.date,
    invoiceNumber: parsed.invoiceNumber,
    subtotalPaise: parsed.subtotalPaise,
    cgstPaise: parsed.cgstPaise,
    sgstPaise: parsed.sgstPaise,
    taxPaise: parsed.taxPaise,
    grandTotalPaise: parsed.grandTotalPaise,
    detectedItems: parsed.items,
    description,
  })
}
