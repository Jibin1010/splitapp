import { describe, expect, it } from 'vitest'
import { parseReceiptResponse } from '@/lib/vision-parser'

describe('parseReceiptResponse', () => {
  it('correctly extracts exact raw text and calculates items from the user receipt', () => {
    const rawAiOutput = `
# PART 1: EXACT TRANSCRIBED TEXT (RAW OCR FIRST)
\`\`\`raw_text
Duniyav
Duniyav Blr
9th Cross Maruthi Nagar, Tavarekere,
Madiwala, 1st Stage, BTM Layout,
Bengaluru, Karnataka
PH:9895062429
GSTIN : 29AAZFD5913E1Z0
Name:
Date: 03/10/26 Dine In: TB 11
14:26
Cashier: 1234 Bill No.: 99307
Token No.: 214
Item Qty. Price Amount
Chicken Biriyani 3 180.00 540.00
Meals 1 120.00 120.00
Total Qty: 4 Sub Total 660.00
CGST@2.5 2.5% 16.50
SGST@2.5 2.5% 16.50
Grand Total ₹693.00
Paid via UPI
Thankyou and Visit Again..!!
\`\`\`

# PART 2: STRUCTURED PRODUCTS & TOTALS
\`\`\`json
{
  "vendor": "Duniyav Blr",
  "date": "03/10/26",
  "invoice_number": "99307",
  "items": [
    {
      "name": "Chicken Biriyani",
      "quantity": 3,
      "unit_price": 180.00,
      "total": 540.00
    },
    {
      "name": "Meals",
      "quantity": 1,
      "unit_price": 120.00,
      "total": 120.00
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

    const result = parseReceiptResponse(rawAiOutput)

    // 1. Raw text verification
    expect(result.rawText).toContain('Duniyav')
    expect(result.rawText).toContain('Chicken Biriyani 3 180.00 540.00')
    expect(result.rawText).toContain('Grand Total ₹693.00')

    // 2. Metadata verification
    expect(result.vendor).toBe('Duniyav Blr')
    expect(result.date).toBe('03/10/26')
    expect(result.invoiceNumber).toBe('99307')
    expect(result.subtotalPaise).toBe(66000)
    expect(result.taxPaise).toBe(3300)
    expect(result.grandTotalPaise).toBe(69300)

    // 3. Items with exact Quantity, Unit Price, and Total
    expect(result.items).toHaveLength(2)

    expect(result.items[0]).toEqual({
      name: 'Chicken Biriyani',
      quantity: 3,
      unitPricePaise: 18000,
      totalPaise: 54000,
    })

    expect(result.items[1]).toEqual({
      name: 'Meals',
      quantity: 1,
      unitPricePaise: 12000,
      totalPaise: 12000,
    })
  })

  it('mathematically reconciles swapped quantity and price errors from vision models', () => {
    // Simulated model error where price (180) was placed in quantity and total (540) in price
    const modelErrorAiOutput = `
\`\`\`raw_text
Item Qty. Price Amount
Chicken Biriyani 3 180.00 540.00
Meals 1 120.00 120.00
\`\`\`

\`\`\`json
{
  "items": [
    {
      "name": "Chicken Biriyani",
      "quantity": 180,
      "unit_price": 540.00,
      "total": 540.00
    },
    {
      "name": "Meals",
      "quantity": 120,
      "unit_price": 120.00,
      "total": 120.00
    }
  ]
}
\`\`\`
`

    const result = parseReceiptResponse(modelErrorAiOutput)
    expect(result.items).toHaveLength(2)

    // Reconciled correctly:
    expect(result.items[0].quantity).toBe(3)
    expect(result.items[0].unitPricePaise).toBe(18000)
    expect(result.items[0].totalPaise).toBe(54000)

    expect(result.items[1].quantity).toBe(1)
    expect(result.items[1].unitPricePaise).toBe(12000)
    expect(result.items[1].totalPaise).toBe(12000)
  })

  it('falls back to regex line parser if model outputs only raw text lines', () => {
    const rawOnly = `
\`\`\`raw_text
Duniyav Blr
Item Qty. Price Amount
Chicken Biriyani 3 180.00 540.00
Meals 1 120.00 120.00
Sub Total 660.00
CGST 16.50
SGST 16.50
Grand Total 693.00
\`\`\`
`
    const result = parseReceiptResponse(rawOnly)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].name).toBe('Chicken Biriyani')
    expect(result.items[0].quantity).toBe(3)
    expect(result.items[0].unitPricePaise).toBe(18000)
    expect(result.items[0].totalPaise).toBe(54000)
  })

  it('correctly parses receipts with currency symbols and prefix quantities (e.g. 3x, 1x)', () => {
    const rawWithPrefix = `
\`\`\`raw_text
THE DAILY GRIND RESTAURANT & CAFE
Date: 08-Nov-2026
3x Chicken Biriyani ₹540.00
1x Meals ₹120.00
Subtotal: ₹660.00
GST: ₹33.00
Total: ₹693.00
\`\`\`
`
    const result = parseReceiptResponse(rawWithPrefix)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].name).toBe('Chicken Biriyani')
    expect(result.items[0].quantity).toBe(3)
    expect(result.items[0].totalPaise).toBe(54000)
    expect(result.items[1].name).toBe('Meals')
    expect(result.items[1].quantity).toBe(1)
    expect(result.items[1].totalPaise).toBe(12000)
  })

  it('parses JSON with products key and trailing commas gracefully', () => {
    const jsonProducts = `
\`\`\`json
{
  "vendor": "Duniyav Bir",
  "products": [
    { "name": "Chicken Biriyani", "quantity": 3, "unit_price": 180, "total": 540, },
    { "name": "Meals", "quantity": 1, "unit_price": 120, "total": 120, },
  ],
  "subtotal": 660,
  "grand_total": 693,
}
\`\`\`
`
    const result = parseReceiptResponse(jsonProducts)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].name).toBe('Chicken Biriyani')
    expect(result.items[0].quantity).toBe(3)
    expect(result.items[0].totalPaise).toBe(54000)
  })

  it('parses single-price lines without explicit quantity (defaults to 1)', () => {
    const rawSinglePrice = `
\`\`\`raw_text
Restaurant Cafe
Chicken Biriyani 180.00
Meals 120.00
Subtotal 300.00
Total 300.00
\`\`\`
`
    const result = parseReceiptResponse(rawSinglePrice)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].name).toBe('Chicken Biriyani')
    expect(result.items[0].quantity).toBe(1)
    expect(result.items[0].unitPricePaise).toBe(18000)
    expect(result.items[0].totalPaise).toBe(18000)
    expect(result.items[1].name).toBe('Meals')
    expect(result.items[1].quantity).toBe(1)
    expect(result.items[1].unitPricePaise).toBe(12000)
  })

  it('correctly calculates proportional GST shares based on participants item spend', async () => {
    const { computeProportionalGstShares, computeEqualGstShares } = await import(
      '@/components/dashboard/vision/vision-gst-section'
    )

    const people = [
      { id: 'p-jibin', name: 'Jibin Jijo' },
      { id: 'p-sindhu', name: 'Sindhu' },
      { id: 'p-smeety', name: 'Smeety' },
      { id: 'p-jijo', name: 'Jijo P George' },
    ]

    const items = [
      {
        id: 'i1',
        name: 'Chicken Biriyani',
        quantity: 3,
        unitPricePaise: 18000,
        totalPaise: 54000,
        assignedParticipantIds: ['p-jibin', 'p-sindhu', 'p-smeety'],
      },
      {
        id: 'i2',
        name: 'Meals',
        quantity: 1,
        unitPricePaise: 12000,
        totalPaise: 12000,
        assignedParticipantIds: ['p-jijo'],
      },
    ]

    const prop = computeProportionalGstShares(items as any, people as any)
    expect(prop['p-jibin']).toBe(27.3)
    expect(prop['p-sindhu']).toBe(27.3)
    expect(prop['p-smeety']).toBe(27.3)
    expect(prop['p-jijo']).toBe(18.1)
    const sum = Object.values(prop).reduce((a, b) => a + b, 0)
    expect(Math.round(sum * 10) / 10).toBe(100.0)

    const eq = computeEqualGstShares(people as any)
    expect(eq['p-jibin']).toBe(25.0)
    expect(eq['p-sindhu']).toBe(25.0)
    expect(eq['p-smeety']).toBe(25.0)
    expect(eq['p-jijo']).toBe(25.0)
  })
})
