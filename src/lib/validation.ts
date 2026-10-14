import { z } from 'zod'
import { MAX_MONEY } from '@/lib/money'
import type { CurrencyCode, IssueCode, ValidationIssue } from '@/types/split'

/**
 * Zod schemas validating the /api/calculate request and response payloads.
 * The request must be structurally valid before the calculation engine runs,
 * so the engine can assume well-formed numbers (integer paise, etc.).
 */

const paiseSchema = z
  .number({ invalid_type_error: 'Amounts must be numbers.' })
  .int('Amounts must be integer paise.')
  .min(0, 'Amounts cannot be negative.')
  .max(MAX_MONEY, 'Amount is too large.')

const percentSchema = z
  .number({ invalid_type_error: 'Percentages must be numbers.' })
  .min(0, 'Percentages cannot be negative.')
  .max(100, 'Percentages cannot exceed 100.')

const quantitySchema = z
  .number({ invalid_type_error: 'Quantities must be numbers.' })
  .int('Quantities must be whole numbers.')
  .min(1, 'Quantity must be at least 1.')
  .max(1_000_000, 'Quantity is too large.')

const unitsSchema = z
  .number({ invalid_type_error: 'Units must be numbers.' })
  .int('Units consumed must be whole numbers.')
  .min(0)
  .max(1_000_000)

const idSchema = z.string().min(1, 'Ids cannot be empty.').max(64)

export const allocationSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('equal'),
    participantIds: z.array(idSchema).max(500),
  }),
  z.object({
    mode: z.literal('quantity'),
    shares: z.record(z.string(), unitsSchema),
  }),
  z.object({
    mode: z.literal('custom'),
    shares: z.record(z.string(), paiseSchema),
  }),
  z.object({
    mode: z.literal('percentage'),
    shares: z.record(z.string(), percentSchema),
  }),
])

export const productItemSchema = z.object({
  id: idSchema,
  name: z.string().max(300, 'Product names must be 300 characters or fewer.'),
  quantity: quantitySchema,
  unitPrice: paiseSchema,
  allocation: allocationSchema,
})

export const personSchema = z.object({
  id: idSchema,
  name: z.string().max(200, 'Names must be 200 characters or fewer.'),
  paidAmount: paiseSchema,
})

export const adjustmentSchema = z.object({
  id: idSchema,
  label: z.string().max(200),
  kind: z.enum(['service_charge', 'tax', 'discount']),
  method: z.enum(['percent', 'fixed']),
  value: z.number().min(0).max(1_000_000_000),
})

export const billSchema = z.object({
  id: idSchema,
  name: z.string().max(200),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  items: z.array(productItemSchema).max(1000),
  people: z.array(personSchema).max(500),
  adjustments: z.array(adjustmentSchema).max(50),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const calculateRequestSchema = z.object({ bill: billSchema })

export const validationIssueSchema = z.object({
  code: z.string() as z.ZodType<IssueCode>,
  message: z.string(),
  itemId: z.string().optional(),
  personId: z.string().optional(),
  adjustmentId: z.string().optional(),
})

export const calculationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(validationIssueSchema),
  itemsTotal: z.number(),
  adjustmentsTotal: z.number(),
  billTotal: z.number(),
  unassignedValue: z.number(),
  itemAllocations: z.record(z.string(), z.record(z.string(), z.number())),
  adjustmentAllocations: z.record(z.string(), z.record(z.string(), z.number())),
  people: z.record(
    z.string(),
    z.object({
      personId: z.string(),
      share: z.number(),
      paid: z.number(),
      net: z.number(),
      itemContributions: z.record(z.string(), z.number()),
    }),
  ),
  settlements: z.array(
    z.object({
      fromPersonId: z.string(),
      toPersonId: z.string(),
      amount: z.number(),
    }),
  ),
})

export const calculateSuccessSchema = z.object({
  ok: z.literal(true),
  result: calculationResultSchema,
})

export const calculateFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'INVALID_JSON', 'INTERNAL_ERROR']),
    message: z.string(),
    issues: z.array(validationIssueSchema).optional(),
  }),
})

export const calculateResponseSchema = z.discriminatedUnion('ok', [calculateSuccessSchema, calculateFailureSchema])

export type BillPayload = z.infer<typeof billSchema>

/** Convert Zod issues into the app's ValidationIssue shape for the API error response. */
export function zodIssuesToValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    code: 'INVALID_ITEM' as IssueCode,
    message: issue.path.length > 0
      ? `${issue.path.join('.')}: ${issue.message}`
      : issue.message,
  }))
}

/** Narrow unknown JSON into a Bill after schema validation. */
export function parseBillPayload(data: unknown): { ok: true; bill: BillPayload } | { ok: false; issues: ValidationIssue[] } {
  const parsed = calculateRequestSchema.safeParse(data)
  if (parsed.success) return { ok: true, bill: parsed.data.bill }
  return { ok: false, issues: zodIssuesToValidationIssues(parsed.error) }
}

/** Runtime guard for currencies coming from settings/env. */
export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && ['INR', 'USD', 'EUR', 'GBP'].includes(value)
}
