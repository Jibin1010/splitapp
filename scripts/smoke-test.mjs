/**
 * End-to-end smoke test against a running SplitLedger server.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
const base = process.argv[2] ?? 'http://localhost:3000'

const bill = {
  id: 'bill-smoke',
  name: 'Dinner',
  currency: 'INR',
  items: [
    { id: 'i1', name: 'Pizza', quantity: 1, unitPrice: 90000, allocation: { mode: 'equal', participantIds: ['p1', 'p2'] } },
    { id: 'i2', name: 'Pasta', quantity: 2, unitPrice: 32000, allocation: { mode: 'equal', participantIds: ['p1', 'p3'] } },
    { id: 'i3', name: 'Cold coffee', quantity: 3, unitPrice: 16000, allocation: { mode: 'equal', participantIds: ['p2', 'p3', 'p4'] } },
  ],
  people: [
    { id: 'p1', name: 'Maya', paidAmount: 202000 },
    { id: 'p2', name: 'Arjun', paidAmount: 0 },
    { id: 'p3', name: 'Neha', paidAmount: 0 },
    { id: 'p4', name: 'Ravi', paidAmount: 0 },
  ],
  adjustments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

async function main() {
  let failures = 0
  const check = (label, ok, detail = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
    if (!ok) failures += 1
  }

  // 1. Homepage renders
  const home = await fetch(base)
  const html = await home.text()
  check('GET / → 200', home.status === 200)
  check('GET / contains app shell', html.includes('SplitLedger') && html.includes('Products'))

  // 2. Valid bill → 200 with expected shares and settlements
  const valid = await fetch(`${base}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bill }),
  })
  const validBody = await valid.json()
  check('POST /api/calculate (valid) → 200', valid.status === 200 && validBody.ok === true)
  check('Bill total = ₹2,020.00', validBody.result?.billTotal === 202000)
  check('Maya share = ₹770', validBody.result?.people?.p1?.share === 77000)
  check('Ravi share = ₹160', validBody.result?.people?.p4?.share === 16000)
  check('3 settlement transfers', validBody.result?.settlements?.length === 3, JSON.stringify(validBody.result?.settlements))

  // 3. Identical input → identical output (determinism)
  const again = await fetch(`${base}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bill }),
  })
  const againBody = await again.json()
  check('Deterministic result', JSON.stringify(againBody) === JSON.stringify(validBody))

  // 4. Incomplete bill → 400 with structured issues
  const broken = JSON.parse(JSON.stringify(bill))
  broken.items[0].allocation = { mode: 'equal', participantIds: [] }
  broken.people[0].paidAmount = 0
  const invalid = await fetch(`${base}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bill: broken }),
  })
  const invalidBody = await invalid.json()
  const codes = (invalidBody.error?.issues ?? []).map((i) => i.code)
  check('POST /api/calculate (incomplete) → 400', invalid.status === 400 && invalidBody.ok === false)
  check('Issues: ITEM_UNASSIGNED + PAID_TOTAL_MISMATCH', codes.includes('ITEM_UNASSIGNED') && codes.includes('PAID_TOTAL_MISMATCH'), codes.join(', '))

  // 5. Malformed JSON → 400 INVALID_JSON
  const malformed = await fetch(`${base}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ nope',
  })
  const malformedBody = await malformed.json()
  check('POST /api/calculate (bad JSON) → 400 INVALID_JSON', malformed.status === 400 && malformedBody.error?.code === 'INVALID_JSON')

  // 6. Schema violation → 400 VALIDATION_ERROR
  const schemaFail = await fetch(`${base}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bill: { id: 'x', items: 'nope' } }),
  })
  const schemaFailBody = await schemaFail.json()
  check('POST /api/calculate (bad payload) → 400 VALIDATION_ERROR', schemaFail.status === 400 && schemaFailBody.error?.code === 'VALIDATION_ERROR')

  console.log(failures === 0 ? '\nAll smoke checks passed.' : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})
