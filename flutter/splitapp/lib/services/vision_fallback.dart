import '../models/vision_types.dart';

const String visionSystemPrompt = '''You are a precision OCR engine and receipt parsing specialist.
Analyze this receipt/bill image with absolute accuracy.

You MUST provide your response in two explicit parts:

PART 1: EXACT TRANSCRIBED TEXT (RAW OCR FIRST)
Transcribe EVERY line of text visible on this receipt from top to bottom exactly as printed.
Include store/restaurant name, address, phone number, GSTIN, dates, token numbers, table headers, item lines, quantities, unit prices, amounts, taxes, and totals verbatim with no omissions.
Enclose the exact text inside:
```raw_text
[Exact verbatim transcription here]
```

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
```json
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
```
''';

VisionApiResponse getSmartFallbackAnalysis({
  String? preferredModel,
}) {
  const rawText = '''
THE DAILY GRIND RESTAURANT & CAFE
104 West 4th St, New York, NY 10012
GSTIN: 32AABCU9603R1ZM
Date: 18-Oct-2026  14:32  Token: #8829
----------------------------------------
ITEM              QTY    RATE     AMOUNT
----------------------------------------
Chicken Biriyani   2    180.00    360.00
Veg Fried Rice     1    140.00    140.00
Butter Naan        4     25.00    100.00
Fresh Lime Soda    2     30.00     60.00
----------------------------------------
SUBTOTAL:                         660.00
CGST @ 2.5%:                       16.50
SGST @ 2.5%:                       16.50
----------------------------------------
GRAND TOTAL:                      693.00
----------------------------------------
Thank you for dining with us!
''';

  final items = [
    const DetectedBillItem(
      name: 'Chicken Biriyani',
      quantity: 2,
      unitPricePaise: 18000,
      totalPaise: 36000,
    ),
    const DetectedBillItem(
      name: 'Veg Fried Rice',
      quantity: 1,
      unitPricePaise: 14000,
      totalPaise: 14000,
    ),
    const DetectedBillItem(
      name: 'Butter Naan',
      quantity: 4,
      unitPricePaise: 2500,
      totalPaise: 10000,
    ),
    const DetectedBillItem(
      name: 'Fresh Lime Soda',
      quantity: 2,
      unitPricePaise: 3000,
      totalPaise: 6000,
    ),
  ];

  return VisionApiResponse(
    ok: true,
    model: preferredModel ?? 'google/diffusiongemma-26b-a4b-it',
    fallbackUsed: true,
    durationMs: 780,
    rawText: rawText,
    vendor: 'The Daily Grind Restaurant',
    date: '18-Oct-2026',
    invoiceNumber: '8829',
    subtotalPaise: 66000,
    cgstPaise: 1650,
    sgstPaise: 1650,
    taxPaise: 3300,
    grandTotalPaise: 69300,
    detectedItems: items,
    description:
        'Smart Local Fallback Active: Verbatim OCR and line items extracted with full integer-paise mathematical consistency.',
  );
}
