import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bill } from '@/types/split'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from '@/components/dashboard/dashboard'
import { calculateBill } from '@/lib/calculations'

/**
 * UI interaction tests against the live dashboard (seeded with the sample
 * bill on first visit). The calculation endpoint is stubbed to behave like
 * the real backend: it computes the result from the bill the app posts.
 *
 * Note: the responsive layout renders both the desktop table and the mobile
 * stacked cards in the DOM, so several figures legitimately appear more than
 * once — queries use getAllBy* where that is expected.
 */

// A faithful test double of /api/calculate: run the real engine on the
// payload the browser posts, exactly like the server does.
function stubApi() {
  return vi.fn(async (_input: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { bill: Bill }
    const result = calculateBill(body.bill)
    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('dashboard', () => {
  it('renders the seeded sample bill with derived totals', () => {
    render(<Dashboard />)

    expect(screen.getByDisplayValue('Dinner')).toBeInTheDocument()
    expect(screen.getAllByText('₹2,460.00').length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('Pizza').length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('Brownie').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Maya').length).toBeGreaterThan(0)
    expect(screen.getByText('Awaiting calculation')).toBeInTheDocument()
  })

  it('adding a product updates the bill total and unassigned value', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    const nameInputs = screen.getAllByLabelText('Product name')
    await user.type(nameInputs[nameInputs.length - 1], 'Juice')

    const priceInputs = await screen.findAllByLabelText('Unit price for Juice')
    await user.type(priceInputs[priceInputs.length - 1], '100')

    // Bill total ₹2,460.00 + ₹100.00 = ₹2,560.00 …
    expect(screen.getAllByText('₹2,560.00').length).toBeGreaterThan(0)
    // … and the new product is flagged as unassigned value in the summary card.
    expect(screen.getByText('₹100.00', { selector: 'p' })).toBeInTheDocument()
  })

  it('changing a quantity recalculates all totals', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    const qtyInputs = screen.getAllByLabelText('Quantity for Pizza')
    await user.clear(qtyInputs[0])
    await user.type(qtyInputs[0], '3')

    // 3 × ₹450 = ₹1,350 for the row; bill total ₹2,460 → ₹2,910.
    expect(screen.getAllByText('₹1,350.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹2,910.00').length).toBeGreaterThan(0)
  })

  it('warns on duplicate person names and does not add them', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    await user.type(screen.getByLabelText('New person name'), 'maya')
    await user.click(screen.getByRole('button', { name: /^Add$/ }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/already in this bill/i)
    // “maya” duplicates “Maya” — no new participant row was added.
    expect(screen.getAllByLabelText(/Amount paid by /i)).toHaveLength(4)
    expect(screen.queryByLabelText('Amount paid by maya')).not.toBeInTheDocument()
  })

  it('removing an assigned person requires confirmation', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    await user.click(screen.getByRole('button', { name: 'Remove Arjun' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Remove Arjun\?/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/assigned to 2 products/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remove person' }))

    // Arjun is gone; exactly three participant rows remain.
    expect(screen.queryByDisplayValue('Arjun')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText(/Amount paid by /i)).toHaveLength(3)
  })

  it('calculates the final split and shows settlement transfers', async () => {
    const user = userEvent.setup()
    const fetchMock = stubApi()
    vi.stubGlobal('fetch', fetchMock)
    render(<Dashboard />)

    await user.click(screen.getByRole('button', { name: /Calculate final split/i }))

    // Sample data: Maya paid ₹2,460; Neha owes ₹700, Arjun ₹610, Ravi ₹290.
    await waitFor(() => expect(screen.getByText('3 transfers')).toBeInTheDocument())
    expect(screen.getAllByText('₹700.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹610.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹290.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Calculated', { exact: true })).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('keeps all entered data when the calculation API fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down')
      }),
    )
    render(<Dashboard />)

    await user.click(screen.getByRole('button', { name: /Calculate final split/i }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.some((a) => /could not reach the calculation service/i.test(a.textContent ?? ''))).toBe(true)

    // Nothing was lost.
    expect(screen.getAllByDisplayValue('Pizza').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹2,460.00').length).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })

  it('blocks finalization on an invalid bill and reports the issues', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { bill: Bill }
      const result = calculateBill(body.bill)
      if (!result.valid) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The bill cannot be finalized yet. Fix the issues below and calculate again.',
              issues: result.issues,
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ ok: true, result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<Dashboard />)

    // Unassign the pizza so the bill has an unassigned product.
    const assignButtons = screen.getAllByLabelText(/open assignment editor/i)
    await user.click(assignButtons[0])
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Clear' }))
    await user.click(within(dialog).getByRole('button', { name: /Save as unassigned/i }))

    // Also clear Maya's payment so the payer total mismatches.
    const paidInputs = screen.getAllByLabelText('Amount paid by Maya')
    await user.clear(paidInputs[0])
    await user.type(paidInputs[0], '0')

    await user.click(screen.getByRole('button', { name: /Calculate final split/i }))

    const alerts = await screen.findAllByRole('alert')
    const settlementAlert = alerts.find((a) => /the bill can’t be finalized yet/i.test(a.textContent ?? ''))
    expect(settlementAlert).toBeDefined()
    expect(settlementAlert).toHaveTextContent(/not assigned to anyone/i)
    expect(settlementAlert).toHaveTextContent(/record who paid the bill/i)

    // Data preserved after the failed calculation.
    expect(screen.getAllByDisplayValue('Pizza').length).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })
})
