export interface DetectedBillItem {
  name: string
  quantity: number
  unitPricePaise: number
  totalPaise: number
}

export interface ParsedReceiptResult {
  rawText: string
  vendor?: string
  date?: string
  invoiceNumber?: string
  subtotalPaise?: number
  cgstPaise?: number
  sgstPaise?: number
  taxPaise?: number
  grandTotalPaise?: number
  items: DetectedBillItem[]
}

/** Helper to parse a single receipt line into a DetectedBillItem */
function parseReceiptLine(line: string): DetectedBillItem | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length < 3) return null

  // Ignore header/footer/tax/metadata lines
  if (
    /^(sub\s*total|total|grand\s*total|net\s*amount|cgst|sgst|gst|tax|vat|service\s*charge|discount|round\s*off|cashier|bill\s*no|invoice|date|time|token|table|gstin|fssai|ph:|phone|tel:|address|thank\s*you|visit\s*again|order|dine\s*in|takeaway|item\s+qty|description|particulars|amount|price|qty|rate)/i.test(
      trimmed
    )
  ) {
    return null
  }

  // Ignore tax rate lines like "CGST @ 2.5%", "SGST @ 2.5%"
  if (/^(cgst|sgst|gst|vat|tax)\s*[@:]|\b(sub\s*total|grand\s*total)\b/i.test(trimmed)) {
    return null
  }

  // Clean currency symbols
  const cleanLine = trimmed
    .replace(/[₹$€£]|rs\.?|inr\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Pattern 1: Prefix quantity: "3x Chicken Biriyani 540.00" or "3 x Chicken Biriyani 180 540" or "1x Meals 120.00"
  const prefixMatch =
    cleanLine.match(/^(\d+)\s*(?:x|\*)\s+(.+?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?$/i) ||
    cleanLine.match(/^(\d+)\s+([A-Za-z].+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/i)

  if (prefixMatch) {
    const qty = parseInt(prefixMatch[1], 10)
    const name = prefixMatch[2].replace(/^[\d\s.*•-]+/, '').trim()
    const n1 = parseFloat(prefixMatch[3])
    const n2 = prefixMatch[4] ? parseFloat(prefixMatch[4]) : null

    if (name.length >= 2 && !/^(total|sub\s*total|subtotal|tax|cgst|sgst|grand|cashier|gstin)$/i.test(name)) {
      let unitPrice = n1
      let total = n2 !== null ? n2 : n1
      if (n2 !== null) {
        if (Math.abs(qty * n1 - n2) < 0.1) {
          unitPrice = n1
          total = n2
        } else if (Math.abs(qty * n2 - n1) < 0.1) {
          unitPrice = n2
          total = n1
        }
      } else {
        total = n1
        unitPrice = qty > 0 ? Math.round((total / qty) * 100) / 100 : n1
      }

      return {
        name,
        quantity: Math.max(1, qty),
        unitPricePaise: Math.round(unitPrice * 100),
        totalPaise: Math.round(total * 100),
      }
    }
  }

  // Pattern 2: Suffix quantity with 2 numbers: "Chicken Biriyani 3 180.00 540.00"
  const suffixMultiMatch = cleanLine.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/)
  if (suffixMultiMatch) {
    const name = suffixMultiMatch[1].replace(/^[\d\s.*•-]+/, '').trim()
    const qty = parseInt(suffixMultiMatch[2], 10)
    const n1 = parseFloat(suffixMultiMatch[3])
    const n2 = parseFloat(suffixMultiMatch[4])

    if (name.length >= 2 && !/^(total|sub\s*total|subtotal|tax|cgst|sgst|grand|cashier|gstin|item|items)$/i.test(name)) {
      let unitPrice = n1
      let total = n2
      if (Math.abs(qty * n1 - n2) < 0.1) {
        unitPrice = n1
        total = n2
      } else if (Math.abs(qty * n2 - n1) < 0.1) {
        unitPrice = n2
        total = n1
      }

      return {
        name,
        quantity: Math.max(1, qty),
        unitPricePaise: Math.round(unitPrice * 100),
        totalPaise: Math.round(total * 100),
      }
    }
  }

  // Pattern 3: Suffix with explicit "x": "Chicken Biriyani 3x 180.00"
  const suffixXMatch = cleanLine.match(/^(.+?)\s+(\d+)\s*(?:x|\*)\s+(\d+(?:\.\d+)?)$/i)
  if (suffixXMatch) {
    const name = suffixXMatch[1].replace(/^[\d\s.*•-]+/, '').trim()
    const qty = parseInt(suffixXMatch[2], 10)
    const amount = parseFloat(suffixXMatch[3])

    if (name.length >= 2 && !/^(total|sub\s*total|subtotal|tax|cgst|sgst|grand|cashier)$/i.test(name)) {
      return {
        name,
        quantity: Math.max(1, qty),
        unitPricePaise: Math.round(amount * 100),
        totalPaise: Math.round(qty * amount * 100),
      }
    }
  }

  // Pattern 4: Single price only: "Chicken Biriyani 180.00" or "Meals 120.00"
  const singlePriceMatch = cleanLine.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/)
  if (singlePriceMatch) {
    const name = singlePriceMatch[1].replace(/^[\d\s.*•-]+/, '').trim()
    const price = parseFloat(singlePriceMatch[2])
    if (
      name.length >= 2 &&
      price > 0 &&
      !/^(total|sub\s*total|subtotal|tax|cgst|sgst|grand|grand\s*total|discount|change|cash|upi|card|bill|token|table|date|cashier|ph)$/i.test(
        name
      )
    ) {
      return {
        name,
        quantity: 1,
        unitPricePaise: Math.round(price * 100),
        totalPaise: Math.round(price * 100),
      }
    }
  }

  return null
}

/**
 * Parses full AI output, extracting:
 * 1. Exact raw text (verbatim line-by-line OCR)
 * 2. Strict JSON structured products (with mathematical consistency reconciliation)
 * 3. Fallback table and multi-pattern line-by-line regex if JSON is missing or incomplete
 */
export function parseReceiptResponse(description: string): ParsedReceiptResult {
  let rawText = ''
  let vendor = ''
  let date = ''
  let invoiceNumber = ''
  let subtotal = 0
  let cgst = 0
  let sgst = 0
  let tax = 0
  let grandTotal = 0
  const items: DetectedBillItem[] = []

  // 1. Extract rawText block (verbatim OCR)
  const rawTextMatch =
    description.match(/```(?:raw_text|text)\s*([\s\S]*?)\s*```/i) ||
    description.match(/#\s*(?:PART 1|EXACT TRANSCRIBED TEXT|RAW OCR)[^\n]*\n([\s\S]*?)(?=#\s*(?:PART 2|STRUCTURED)|```json|$)/i)

  if (rawTextMatch && rawTextMatch[1].trim()) {
    rawText = rawTextMatch[1].trim()
  } else {
    const splitBeforeJson = description.split(/```json|\|[\s\S]*\|[\s\S]*\|/i)[0].trim()
    rawText = splitBeforeJson || description.trim()
  }

  // 2. Extract JSON block (flexible: ```json ... ```, or direct {...} / [...])
  let jsonString = ''
  const codeBlockMatch = description.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch && (codeBlockMatch[1].trim().startsWith('{') || codeBlockMatch[1].trim().startsWith('['))) {
    jsonString = codeBlockMatch[1].trim()
  } else {
    const rawJsonObjMatch =
      description.match(/(\{[\s\S]*"items"[\s\S]*\})/i) ||
      description.match(/(\{[\s\S]*"products"[\s\S]*\})/i) ||
      description.match(/(\{[\s\S]*\})/i)
    if (rawJsonObjMatch) {
      jsonString = rawJsonObjMatch[1].trim()
    } else {
      const rawJsonArrMatch = description.match(/(\[[\s\S]*\])/i)
      if (rawJsonArrMatch) {
        jsonString = rawJsonArrMatch[1].trim()
      }
    }
  }

  if (jsonString) {
    try {
      const sanitized = jsonString
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
      const data = JSON.parse(sanitized)

      vendor = data.vendor || data.restaurant || data.store || ''
      date = data.date || ''
      invoiceNumber = data.invoice_number || data.bill_no || data.token_no || data.bill_number || ''
      subtotal = Number(data.subtotal) || 0
      cgst = Number(data.cgst) || 0
      sgst = Number(data.sgst) || 0
      tax = Number(data.tax) || (cgst + sgst) || 0
      grandTotal = Number(data.grand_total) || Number(data.total) || 0

      const rawItemsList = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.line_items)
        ? data.line_items
        : Array.isArray(data.dishes)
        ? data.dishes
        : Array.isArray(data)
        ? data
        : []

      for (const rawItem of rawItemsList) {
        if (!rawItem || typeof rawItem !== 'object') continue
        const name = String(rawItem.name || rawItem.item || rawItem.description || '').replace(/^[\d\s.*•-]+/, '').trim()
        if (!name || /^(sub\s*total|subtotal|tax|total|grand|cgst|sgst|round|change)$/i.test(name)) continue

        let qty = Number(rawItem.quantity || rawItem.qty || rawItem.count) || 0
        let unitPrice = Number(rawItem.unit_price || rawItem.price || rawItem.rate) || 0
        let total = Number(rawItem.total || rawItem.amount || rawItem.line_total) || 0

        // Mathematical reconciliation
        if (unitPrice > 0 && total > 0) {
          if (Math.abs(qty * unitPrice - total) > 0.05) {
            if (unitPrice === total && qty > 0 && Math.abs(total / qty - Math.round(total / qty)) < 0.05) {
              const realPrice = qty
              const realTotal = total
              const realQty = Math.round(realTotal / realPrice)
              qty = realQty
              unitPrice = realPrice
              total = realTotal
            } else if (Math.abs(total / unitPrice - Math.round(total / unitPrice)) < 0.01) {
              qty = Math.round(total / unitPrice)
            } else if (qty > 0) {
              unitPrice = Math.round((total / qty) * 100) / 100
            }
          }
        } else if (qty > 0 && total > 0 && unitPrice === 0) {
          unitPrice = Math.round((total / qty) * 100) / 100
        } else if (qty > 0 && unitPrice > 0 && total === 0) {
          total = Math.round(qty * unitPrice * 100) / 100
        } else if (qty === 0 && unitPrice > 0 && total > 0) {
          qty = Math.max(1, Math.round(total / unitPrice))
        }

        if (qty <= 0) qty = 1
        if (unitPrice <= 0 && total > 0) unitPrice = total / qty
        if (total <= 0 && unitPrice > 0) total = qty * unitPrice

        items.push({
          name,
          quantity: Math.max(1, Math.round(qty)),
          unitPricePaise: Math.round(unitPrice * 100),
          totalPaise: Math.round(total * 100),
        })
      }
    } catch {
      // JSON parse failed; fall back to table and lines
    }
  }

  // 3. Fallback: Table Extraction if JSON had no items
  if (items.length === 0) {
    const lines = description.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
        const cols = trimmed.split('|').map((c) => c.trim()).filter((c) => c.length > 0)
        if (cols.some((c) => /item|description|particular|quantity|qty|price|amount/i.test(c))) continue
        if (cols.some((c) => /subtotal|tax|total|grand|cgst|sgst/i.test(c))) continue

        const name = cols[0].replace(/^[\d\s.*•-]+/, '').trim()
        const nums = cols.slice(1).map((c) => parseFloat(c.replace(/[^0-9.]/g, ''))).filter((n) => !isNaN(n))

        if (nums.length >= 3) {
          const [n1, n2, n3] = nums
          if (Math.abs(n1 * n2 - n3) < 0.1) {
            items.push({ name, quantity: Math.round(n1), unitPricePaise: Math.round(n2 * 100), totalPaise: Math.round(n3 * 100) })
          } else if (Math.abs(n2 * n1 - n3) < 0.1) {
            items.push({ name, quantity: Math.round(n2), unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n3 * 100) })
          } else {
            items.push({ name, quantity: Math.max(1, Math.round(n1)), unitPricePaise: Math.round(n2 * 100), totalPaise: Math.round(n3 * 100) })
          }
        } else if (nums.length === 2) {
          const [n1, n2] = nums
          if (n1 > 0 && n2 > n1 && Math.abs(n2 / n1 - Math.round(n2 / n1)) < 0.05) {
            items.push({ name, quantity: Math.round(n2 / n1), unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n2 * 100) })
          } else {
            items.push({ name, quantity: 1, unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n2 * 100) })
          }
        }
      }
    }
  }

  // 4. Fallback: Multi-pattern line parsing on rawText and description if still no items
  if (items.length === 0) {
    const sourceText = rawText ? `${rawText}\n${description}` : description
    const lines = sourceText.split('\n')
    const seenNames = new Set<string>()

    for (const line of lines) {
      const parsedItem = parseReceiptLine(line)
      if (parsedItem && !seenNames.has(parsedItem.name.toLowerCase())) {
        seenNames.add(parsedItem.name.toLowerCase())
        items.push(parsedItem)
      }
    }
  }

  // 5. Parse totals if missing
  if (subtotal === 0 || grandTotal === 0) {
    const combined = `${description}\n${rawText}`
    const subMatch = combined.match(/sub\s*total[:\s]+(?:₹|rs\.?)?\s*([0-9.]+)/i)
    if (subMatch) subtotal = parseFloat(subMatch[1])

    const grandMatch = combined.match(/grand\s*total[:\s]+(?:₹|rs\.?)?\s*([0-9.]+)/i)
    if (grandMatch) grandTotal = parseFloat(grandMatch[1])

    const cgstMatch = combined.match(/cgst[^\n\d]*([0-9.]+)/i)
    if (cgstMatch) cgst = parseFloat(cgstMatch[1])

    const sgstMatch = combined.match(/sgst[^\n\d]*([0-9.]+)/i)
    if (sgstMatch) sgst = parseFloat(sgstMatch[1])

    if (tax === 0) tax = cgst + sgst
  }

  // If subtotal is still 0, compute from items
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.totalPaise, 0) / 100
  }
  if (grandTotal === 0 && subtotal > 0) {
    grandTotal = subtotal + tax
  }

  return {
    rawText,
    vendor,
    date,
    invoiceNumber,
    subtotalPaise: Math.round(subtotal * 100),
    cgstPaise: Math.round(cgst * 100),
    sgstPaise: Math.round(sgst * 100),
    taxPaise: Math.round(tax * 100),
    grandTotalPaise: Math.round(grandTotal * 100),
    items,
  }
}
