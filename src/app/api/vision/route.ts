import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface VisionRequestBody {
  image?: string
  prompt?: string
  model?: string
}

export interface DetectedBillItem {
  name: string
  quantity: number
  unitPricePaise: number
  totalPaise: number
}

/**
 * Extracts line items from the markdown description if present.
 * Detects table header indices (Description, Quantity, Unit Price, Amount)
 * so extra columns like HSN/SAC, Sl No, or Tax % are never confused with quantity or price.
 */
function parseItemsFromDescription(text: string): DetectedBillItem[] {
  const items: DetectedBillItem[] = []
  const lines = text.split('\n')

  let headerIndices: {
    nameIdx: number
    qtyIdx: number
    priceIdx: number
    amountIdx: number
  } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
      const cols = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0)

      // Detect header row
      const isHeader = cols.some((c) =>
        /item|description|particular|quantity|qty|price|amount/i.test(c)
      )

      if (isHeader) {
        let nameIdx = -1
        let qtyIdx = -1
        let priceIdx = -1
        let amountIdx = -1

        cols.forEach((col, idx) => {
          const lower = col.toLowerCase()
          if (/item|desc|product|particular/i.test(lower) && nameIdx === -1) {
            nameIdx = idx
          } else if (/^qty|quantity|units|count/i.test(lower) && !/hsn|sac/i.test(lower)) {
            qtyIdx = idx
          } else if (/unit\s*price|rate|price/i.test(lower) && !/amount|total/i.test(lower)) {
            priceIdx = idx
          } else if (/amount|total/i.test(lower) && !/subtotal|grand/i.test(lower)) {
            amountIdx = idx
          }
        })

        if (nameIdx !== -1) {
          headerIndices = { nameIdx, qtyIdx, priceIdx, amountIdx }
          continue
        }
      }

      // Skip summary / tax / total rows
      if (cols.some((c) => /subtotal|tax|total|grand|cgst|sgst/i.test(c))) {
        continue
      }

      let name = ''
      let qty = 1
      let unitPrice = 0
      let total = 0

      if (headerIndices && headerIndices.nameIdx !== -1) {
        name = cols[headerIndices.nameIdx] || ''
        if (headerIndices.qtyIdx !== -1 && cols[headerIndices.qtyIdx]) {
          qty = parseFloat(cols[headerIndices.qtyIdx].replace(/[^0-9.]/g, '')) || 1
        }
        if (headerIndices.priceIdx !== -1 && cols[headerIndices.priceIdx]) {
          unitPrice = parseFloat(cols[headerIndices.priceIdx].replace(/[^0-9.]/g, '')) || 0
        }
        if (headerIndices.amountIdx !== -1 && cols[headerIndices.amountIdx]) {
          total = parseFloat(cols[headerIndices.amountIdx].replace(/[^0-9.]/g, '')) || (unitPrice * qty)
        }
      } else {
        // Fallback for headerless tables
        if (cols.length >= 6) {
          // [slNo, name, hsn, qty, price, total]
          name = cols[1]
          qty = parseFloat(cols[3].replace(/[^0-9.]/g, '')) || 1
          unitPrice = parseFloat(cols[4].replace(/[^0-9.]/g, '')) || 0
          total = parseFloat(cols[5].replace(/[^0-9.]/g, '')) || (unitPrice * qty)
        } else if (cols.length === 5) {
          // [slNo, name, qty, price, total]
          name = cols[1]
          qty = parseFloat(cols[2].replace(/[^0-9.]/g, '')) || 1
          unitPrice = parseFloat(cols[3].replace(/[^0-9.]/g, '')) || 0
          total = parseFloat(cols[4].replace(/[^0-9.]/g, '')) || (unitPrice * qty)
        } else if (cols.length === 4) {
          // [name, qty, price, total]
          name = cols[0]
          qty = parseFloat(cols[1].replace(/[^0-9.]/g, '')) || 1
          unitPrice = parseFloat(cols[2].replace(/[^0-9.]/g, '')) || 0
          total = parseFloat(cols[3].replace(/[^0-9.]/g, '')) || (unitPrice * qty)
        }
      }

      if (name && !/subtotal|tax|total|grand|cgst|sgst/i.test(name)) {
        const unitPricePaise = Math.round(unitPrice * 100)
        const totalPaise = Math.round((total || unitPrice * qty) * 100)
        items.push({
          name: name.replace(/[*_]/g, '').trim(),
          quantity: Math.max(1, Math.round(qty)),
          unitPricePaise,
          totalPaise,
        })
      }
    }
  }

  return items
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
      max_tokens: 1500,
      temperature: 0.2,
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
 * Includes automatic failover to Llama 3.2 11B Vision if DiffusionGemma experiences high queue times.
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

  const systemOrUserPrompt =
    userPrompt && userPrompt.trim().length > 0
      ? `${userPrompt.trim()} Important: when creating the items table, maintain separate columns for SL No, Item Description, HSN/SAC (if present), QTY, Unit Price, and Amount. Ensure HSN/SAC is never placed in the quantity or price column.`
      : 'Please perform a comprehensive visual and textual analysis of this image. Extract document title, invoice number, date, vendor, customer, payment details, subtotal, taxes (CGST/SGST), and grand total. In the line items table, include separate columns for: SL. NO., ITEM DESCRIPTION, HSN/SAC (if present), QTY, UNIT PRICE, and AMOUNT. Ensure HSN/SAC is strictly kept in its own column.'

  const primaryModel = requestedModel || process.env.NVIDIA_VISION_MODEL || 'google/diffusiongemma-26b-a4b-it'
  const fallbackModel = 'meta/llama-3.2-11b-vision-instruct'

  let activeModelUsed = primaryModel
  let fallbackUsed = false
  let description = ''
  let durationMs = 0

  // 1. Try Primary Model (give 30 seconds)
  try {
    const result = await callNvidiaModel(
      primaryModel,
      systemOrUserPrompt,
      image,
      apiKey,
      apiBaseUrl,
      primaryModel === fallbackModel ? 50000 : 30000
    )
    description = result.description
    durationMs = result.durationMs
  } catch (primaryError: unknown) {
    console.warn(`Primary model ${primaryModel} failed or timed out:`, primaryError)

    // If primary was not the fallback model, automatically failover to meta/llama-3.2-11b-vision-instruct!
    if (primaryModel !== fallbackModel) {
      try {
        console.log(`Failing over to fast vision model: ${fallbackModel}...`)
        const fallbackResult = await callNvidiaModel(
          fallbackModel,
          systemOrUserPrompt,
          image,
          apiKey,
          apiBaseUrl,
          40000
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

  const detectedItems = parseItemsFromDescription(description)

  return NextResponse.json({
    ok: true,
    model: activeModelUsed,
    fallbackUsed,
    durationMs,
    description,
    detectedItems,
  })
}
