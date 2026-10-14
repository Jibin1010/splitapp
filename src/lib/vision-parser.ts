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

/**
 * Parses full AI output, extracting:
 * 1. Exact raw text (verbatim line-by-line OCR)
 * 2. Strict JSON structured products (with mathematical consistency reconciliation)
 * 3. Fallback table and line-by-line regex if JSON is missing or incomplete
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
    // If no explicit raw_text block, extract everything prior to the json/table block
    const splitBeforeJson = description.split(/```json|\|[\s\S]*\|[\s\S]*\|/i)[0].trim()
    rawText = splitBeforeJson || description.trim()
  }

  // 2. Extract JSON block
  const jsonMatch =
    description.match(/```(?:json)?\s*(\{[\s\S]*?"items"[\s\S]*?\})\s*```/i) ||
    description.match(/(\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/i)

  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      vendor = data.vendor || ''
      date = data.date || ''
      invoiceNumber = data.invoice_number || data.bill_no || data.token_no || ''
      subtotal = Number(data.subtotal) || 0
      cgst = Number(data.cgst) || 0
      sgst = Number(data.sgst) || 0
      tax = Number(data.tax) || (cgst + sgst) || 0
      grandTotal = Number(data.grand_total) || 0

      if (Array.isArray(data.items)) {
        for (const rawItem of data.items) {
          if (!rawItem || typeof rawItem !== 'object') continue
          const name = String(rawItem.name || '').replace(/^[\d\s.*•-]+/, '').trim()
          if (!name || /subtotal|tax|total|grand|cgst|sgst/i.test(name)) continue

          let qty = Number(rawItem.quantity) || 0
          let unitPrice = Number(rawItem.unit_price) || 0
          let total = Number(rawItem.total) || 0

          // Mathematical reconciliation: only adjust if numbers don't add up
          if (unitPrice > 0 && total > 0) {
            if (Math.abs(qty * unitPrice - total) > 0.05) {
              // Check if model shifted numbers (e.g. qty was price 180, unitPrice was total 540, total was 540)
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

  // 4. Fallback: Plain Text Line-by-Line Regex on rawText if still no items
  if (items.length === 0 && rawText) {
    const lines = rawText.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || /^(total|subtotal|grand|cgst|sgst|tax|cashier|bill|date|token|gstin|item|dine)/i.test(trimmed)) continue
      const match = trimmed.match(/^(.+?)\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)(?:\s+([0-9]+(?:\.[0-9]+)?))?$/)
      if (match) {
        const name = match[1].replace(/^[\d\s.*•-]+/, '').trim()
        if (/^(item|description|particulars)$/i.test(name)) continue
        const n1 = parseFloat(match[2])
        const n2 = parseFloat(match[3])
        const n3 = match[4] !== undefined ? parseFloat(match[4]) : null

        if (n3 !== null) {
          if (Math.abs(n1 * n2 - n3) < 0.1) {
            items.push({ name, quantity: Math.round(n1), unitPricePaise: Math.round(n2 * 100), totalPaise: Math.round(n3 * 100) })
          } else if (Math.abs(n2 * n1 - n3) < 0.1) {
            items.push({ name, quantity: Math.round(n2), unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n3 * 100) })
          } else {
            items.push({ name, quantity: Math.round(n1), unitPricePaise: Math.round(n2 * 100), totalPaise: Math.round(n3 * 100) })
          }
        } else {
          if (n1 > 0 && n2 > n1 && Math.abs(n2 / n1 - Math.round(n2 / n1)) < 0.05) {
            items.push({ name, quantity: Math.round(n2 / n1), unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n2 * 100) })
          } else {
            items.push({ name, quantity: 1, unitPricePaise: Math.round(n1 * 100), totalPaise: Math.round(n2 * 100) })
          }
        }
      }
    }
  }

  // 5. Parse totals if missing
  if (subtotal === 0 || grandTotal === 0) {
    const combined = description + '\n' + rawText
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
