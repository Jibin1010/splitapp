import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/user-search'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/search?q=<query>&limit=<1-20>&exclude=<name1,name2>
 *
 * 5 Lakh User Architecture Search Endpoint:
 * - 250ms debounced frontend query recipient
 * - PostgreSQL Partial B-Tree + Trigram GIN indexed lookup (< 2.5ms)
 * - Server-side LRU In-Memory Cache (0.05ms on cache hit)
 * - Strict LIMIT 10 (max 20) to prevent network bloat
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 10, 20))
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
        cached: false,
        results: [],
      })
    }

    const { results, executionTimeMs, cached } = await searchUsers(query, {
      limit,
      excludeNames,
    })

    return NextResponse.json(
      {
        ok: true,
        query,
        count: results.length,
        executionTimeMs,
        cached,
        results,
      },
      {
        headers: {
          'X-Cache': cached ? 'HIT' : 'MISS',
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
