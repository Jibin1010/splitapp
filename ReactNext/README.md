# SplitLedger — Split bills fairly

A modern, **no-login money-splitting web app**. Enter products and prices, add the people involved, say who consumed what, and SplitLedger calculates everyone's exact share plus the minimum transfers needed to settle the bill.

**Version 1.0** · Desktop-first, responsive · No account required

Built with **Next.js (App Router) + React + TypeScript + Tailwind CSS**, shadcn-style UI components, **Lucide** icons, **Zod** validation, a server-side calculation engine, localStorage persistence, and **Vitest + React Testing Library** tests.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # production build (type-checked)
npm run start      # serve the production build
npm test           # run the test suite (Vitest)
npm run test:watch # tests in watch mode
```

> Node.js >= 18.18 required.

## How it works

The entire flow lives on **one dashboard** — no wizards, no onboarding:

1. **Enter products** — name, quantity and unit price. Line totals and the bill total update as you type.
2. **Add people** — names only, no profiles. Names are unique per bill (spacing/capitalisation-insensitive), so `Maya` and `maya` trigger a duplicate warning.
3. **Assign each product** — pick who shared it and how (see sharing modes below).
4. **Record who paid** — one or multiple payers; the “Paid all” shortcut marks a person as covering the rest of the bill.
5. **Press Calculate final split** — the backend validates the bill, computes exact shares, and returns settlement instructions like *“Neha pays Maya ₹700.00”*.

Optional **bill-level adjustments** (service charge, tax, discount — percent or fixed) are allocated proportionally to each person's item share and can be previewed before calculating.

### Per-product sharing modes

| Mode | Rule | Example |
| --- | --- | --- |
| **Split equally** | Chosen people divide the line total evenly | ₹900 pizza between Maya and Arjun → ₹450 each |
| **By quantity** | Units consumed per person; must sum to the quantity purchased | 3 coffees: Maya 2, Arjun 1 → ₹320 / ₹160 |
| **Custom amounts** | Exact money values; must add up to the line total exactly | ₹600 dish → ₹400 + ₹200 |
| **Percentages** | Percent weights; must total exactly 100% | ₹1,000 → 60% / 40% → ₹600 / ₹400 |

### Accuracy rules

1. **Integer paise internally.** ₹450.00 is stored as `45000`. No floating-point money math anywhere.
2. **Never lose a paisa.** Splitting ₹100 three ways yields ₹33.34 / ₹33.33 / ₹33.33 — the sum is exactly ₹100. Remainders are distributed deterministically.
3. **Reject incomplete allocations.** Unassigned products, custom amounts that don't add up, percentages that don't total 100, or consumed units that don't match the quantity all block finalization with actionable messages.
4. **Validate payer totals.** The total marked as paid must match the bill total (including adjustments) before settlements are generated.
5. **Deterministic settlements.** Largest debtor ↔ largest creditor matching (amount desc, then name asc), producing identical results for identical inputs and a minimal number of transfers.

`Net balance = amount paid − total share`. Positive: the person is owed money. Negative: they owe money.

## Architecture

```
src/
├── app/
│   ├── layout.tsx            # root layout + metadata
│   ├── page.tsx               # renders the dashboard
│   ├── globals.css            # Tailwind v4 theme + print styles
│   └── api/calculate/route.ts # POST /api/calculate — the official engine
├── components/
│   ├── layout/                # sidebar (desktop + mobile drawer), page header
│   ├── dashboard/             # summary cards, products table, people panel,
│   │                          # split summary, settlement preview, history,
│   │                          # settings
│   ├── forms/                 # product fields, person form, allocation dialog
│   └── ui/                    # shadcn-style primitives (button, card, dialog…)
├── lib/
│   ├── calculations.ts        # THE calculation engine (single source of truth)
│   ├── money.ts               # integer-paise parsing, formatting, distribution
│   ├── validation.ts          # Zod schemas for the API request/response
│   ├── storage.ts             # localStorage drafts, history, settings
│   ├── api-client.ts          # typed client for /api/calculate
│   ├── export.ts              # CSV export + print
│   ├── seed.ts                # first-visit sample bill
│   └── store.tsx              # React state (reducer + autosave)
└── types/split.ts              # shared domain types
tests/                          # Vitest: money, engine, API, storage, UI
```

**One engine, two consumers.** UI components never compute money themselves. `lib/calculations.ts` is imported by both the browser (for live subtotals and validation hints) and the API route (for official results), so displayed figures can never drift from the backend.

## API

### `POST /api/calculate`

Request body:

```jsonc
{
  "bill": {
    "id": "bill-…",
    "name": "Dinner",
    "currency": "INR",
    "items": [
      {
        "id": "item-…",
        "name": "Pizza",
        "quantity": 2,
        "unitPrice": 45000,                 // integer paise
        "allocation": { "mode": "equal", "participantIds": ["p-1", "p-2"] }
      }
    ],
    "people": [{ "id": "p-1", "name": "Maya", "paidAmount": 246000 }],
    "adjustments": [
      { "id": "adj-…", "label": "Service charge", "kind": "service_charge", "method": "percent", "value": 10 }
    ],
    "createdAt": "…", "updatedAt": "…"
  }
}
```

Success (`200`): bill total, per-item allocations, per-person `share`/`paid`/`net`, and `settlements` (transfer list).

Failure (`400`): `{ ok: false, error: { code, message, issues[] } }` with structured, human-readable issues — the API never silently finalizes an incomplete bill.

### Environment variables

Copy `.env.example` → `.env.local` (already provided):

```ini
NEXT_PUBLIC_APP_NAME=SplitLedger
NEXT_PUBLIC_DEFAULT_CURRENCY=INR

# Optional future calculation/API provider — unused in v1
SPLIT_ENGINE_API_URL=
SPLIT_ENGINE_API_KEY=

# Optional future database; not required for version 1
DATABASE_URL=
```

The app's own `/api/calculate` endpoint needs **no external API or key** — all arithmetic is deterministic and runs server-side. The reserved variables exist so an external engine can be wired in later without UI changes.

> **Security:** never prefix secrets (`SPLIT_ENGINE_API_KEY`, `DATABASE_URL`, …) with `NEXT_PUBLIC_` — that prefix exposes values to the browser bundle. Keep secrets server-side; `.env.local` is git-ignored.

## Local drafts, history and privacy (no-login behavior)

- **Autosave** — the active bill persists to localStorage shortly after edits; refresh and it comes back.
- **Save Draft** — explicitly saves a named copy into **History**, which you can reopen any time.
- **New Split** — starts a fresh bill (asks for confirmation first).
- **Clear all data** (Settings) — wipes draft/history/settings after confirmation and restores the example bill.
- **Export** — results as CSV or a printable page.
- **Privacy** — everything stays in this browser. There is **no cloud sync, no shareable links, and no cross-device data** in v1; clearing this site's stored data deletes saved bills. Calculations are sent only to this app's own backend.

The first visit shows a sample bill (Dinner with Maya, Arjun, Neha and Ravi) for visual testing — every value is editable and nothing is locked to those examples.

## Testing

`npm test` runs 61 tests covering the validation plan:

| Case | Covered by |
| --- | --- |
| Add product / change quantity → totals recalculate | `dashboard.test.tsx` |
| Add/remove participant updates counts & assignments | `dashboard.test.tsx` |
| Split ₹100 among three → exact ₹100 | `money.test.ts`, `calculations.test.ts` |
| Custom amounts ≠ item total → blocked with difference | `calculations.test.ts` |
| Product with no participants → flagged unassigned | `calculations.test.ts`, `api.test.ts` |
| Paid amount ≠ bill total → settlement rejected | `calculations.test.ts`, `api.test.ts` |
| Duplicate person name → validation message | `calculations.test.ts`, `dashboard.test.tsx` |
| Delete assigned participant → confirmation + reassignment | `dashboard.test.tsx` |
| Same input calculated twice → identical results | `calculations.test.ts` |
| Refresh → draft restored from localStorage | `storage.test.ts` |
| New bill → no leakage of previous data | `storage.test.ts`, reducer design |
| Long names, zero/negative prices, decimals, big quantities, API failures with data preserved | Zod bounds, `calculations.test.ts`, `api.test.ts`, `dashboard.test.tsx` |

## Roadmap (post-v1 ideas)

Receipt scanning, automatic tax detection, multi-currency bills, payment processing, and a persistence backend with shareable bill URLs. The `SPLIT_ENGINE_*` and `DATABASE_URL` env placeholders are the connection points for these.
