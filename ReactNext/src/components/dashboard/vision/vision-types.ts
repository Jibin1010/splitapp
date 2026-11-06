export interface DetectedItem {
  name: string
  quantity: number
  unitPricePaise: number
  totalPaise: number
}

export interface EditableDetectedItem extends DetectedItem {
  id: string
  assignedParticipantIds: string[]
}

export interface DialogPerson {
  id: string
  name: string
  photo?: string
  phone?: string
  isPhoneVerified?: boolean
  isNew?: boolean
}

export interface VisionApiResponse {
  ok: boolean
  model?: string
  fallbackUsed?: boolean
  durationMs?: number
  rawText?: string
  vendor?: string
  date?: string
  invoiceNumber?: string
  subtotalPaise?: number
  cgstPaise?: number
  sgstPaise?: number
  taxPaise?: number
  grandTotalPaise?: number
  detectedItems?: DetectedItem[]
  prepopulatedItems?: EditableDetectedItem[]
  description?: string
  error?: {
    code: string
    message: string
  }
}

export interface VisionModelOption {
  id: string
  name: string
  badge: string
  subtitle: string
  isRecommended: boolean
}

export const AVAILABLE_MODELS: VisionModelOption[] = [
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'Google DiffusionGemma 26B',
    badge: 'Recommended · High Precision OCR',
    subtitle: 'Fast, verbatim receipt OCR & automatic mathematical reconciliation',
    isRecommended: true,
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron Omni Reasoning 30B',
    badge: 'Reasoning Engine',
    subtitle: 'Deep reasoning analysis for complex or faded bills',
    isRecommended: false,
  },
  {
    id: 'nvidia/nemotron-parse-2.0',
    name: 'Nemotron Parse 2.0',
    badge: 'Fast OCR',
    subtitle: 'Ultra fast document parsing for receipts',
    isRecommended: false,
  },
]

export interface PresetPrompt {
  id: string
  label: string
  description: string
  prompt: string
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'detailed',
    label: 'Exact Text & Item Breakdown',
    description: 'Extract text, items, quantities, prices and totals',
    prompt:
      'Transcribe every line of text from the receipt exactly as printed (Exact Raw Text First). Then extract all purchased products with exact Name, Quantity, Unit Price, and Total Amount, plus subtotal, taxes, and grand total.',
  },
  {
    id: 'items_only',
    label: 'Extract Items & Prices Only',
    description: 'Get structured items with prices',
    prompt:
      'Extract every product with its Name, Quantity, Unit Price, and Total Amount. Verify mathematical consistency (quantity * unit_price = total).',
  },
  {
    id: 'quick',
    label: 'Quick Description',
    description: 'Short summary of the receipt',
    prompt:
      'Describe what is in this image in detail. Mention all visible text, numbers, and key elements.',
  },
]

export const SAMPLE_RECEIPT_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23fafaf9"/><text x="20" y="40" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2318181b">Duniyav Bir</text><text x="20" y="65" font-family="sans-serif" font-size="11" fill="%2371717a">%2399307 · 03/10/26</text><line x1="20" y1="80" x2="180" y2="80" stroke="%23e4e4e7" stroke-width="1"/><text x="20" y="110" font-family="sans-serif" font-size="11" fill="%2327272a">3x Chicken Biriyani</text><text x="140" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="%2327272a">540.00</text><text x="20" y="140" font-family="sans-serif" font-size="11" fill="%2327272a">1x Meals</text><text x="140" y="140" font-family="sans-serif" font-size="11" font-weight="bold" fill="%2327272a">120.00</text><line x1="20" y1="160" x2="180" y2="160" stroke="%23e4e4e7" stroke-width="1"/><text x="20" y="185" font-family="sans-serif" font-size="11" fill="%2371717a">Subtotal: ₹660.00</text><text x="20" y="205" font-family="sans-serif" font-size="11" fill="%2371717a">GST / Tax: ₹33.00</text><text x="20" y="235" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2318181b">Total: ₹693.00</text></svg>'
