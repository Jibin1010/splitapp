import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/user-search'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/search?q=<query>&limit=<1-25>&exclude=<name1,name2>
 *
 * Sub-millisecond lookup for users by name or phone number.
 * Backed by PostgreSQL B-Tree (phone text_pattern_ops) and Trigram GIN (names).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 10, 25))
    const rawExclude = searchParams.get('exclude') || ''
    const excludeNames = rawExclude
      ? rawExclude
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
      : []

    if (!query.trim()) {
      return NextResponse.json({
        ok: true,
        query: '',
        count: 0,
        executionTimeMs: 0,
        results: [],
      })
    }

    const { results, executionTimeMs } = await searchUsers(query, {
      limit,
      excludeNames,
    })

    return NextResponse.json(
      {
        ok: true,
        query,
        count: results.length,
        executionTimeMs,
        results,
      },
      {
        headers: {
          'Server-Timing': `search;dur=${executionTimeMs}`,
        },
      }
    )
  } catch (error: any) {
    console.error('Error in /api/users/search:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Failed to search users',
        results: [],
      },
      { status: 500 }
    )
  }
}
