/**
 * Food image mappings for visual table representation.
 * Returns a high-quality thumbnail image URL for known food items,
 * or falls back to dish/cutlery graphics.
 */

const FOOD_PRESETS: Array<{ pattern: RegExp; url: string }> = [
  {
    pattern: /pizza/i,
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /garlic\s*bread|bread|toast|baguette|garlic/i,
    url: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /pasta|spaghetti|macaroni|noodles|penne/i,
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /cold\s*coffee|iced\s*coffee|frappe|shake|latte|cappuccino|coffee|espresso|mocha/i,
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /brownie|chocolate|fudge|lava\s*cake/i,
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /burger|cheeseburger|patty/i,
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /biryani|rice|pulao/i,
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /fries|french\s*fries|potato/i,
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /salad|caesar/i,
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /sandwich|sub/i,
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=160&auto=format&fit=crop&q=80',
  },
  {
    pattern: /cake|pastry|dessert|ice\s*cream|sundae/i,
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&auto=format&fit=crop&q=80',
  },
]

export function getFoodImage(name: string, customUrl?: string): string | null {
  if (customUrl) return customUrl
  const trimmed = name.trim()
  if (!trimmed) return null
  for (const preset of FOOD_PRESETS) {
    if (preset.pattern.test(trimmed)) {
      return preset.url
    }
  }
  return null
}
