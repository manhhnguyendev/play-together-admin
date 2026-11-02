import type { AdminTier, UserSummary } from '@/api/types'

/**
 * Which back-office tier may open each section of the console.
 *
 * The lists mirror the `@AdminRoles()` decorators on the matching routes, so a
 * page never offers what the API would answer with 403. `SUPER_ADMIN` satisfies
 * every list — the guard treats it as a wildcard — and an empty list means the
 * routes behind it only ask for the ADMIN role, so an account without a tier can
 * still read them.
 *
 * `/users` is the list of every account and stays with the moderator, while
 * `/users/:id` is one account read through the dossier route, which the API also
 * gives to the money tier: settling a payout needs the wallet and open orders of
 * the person being paid.
 */
const SECTION_TIERS: Record<string, readonly AdminTier[]> = {
  '/': [],
  '/orders': ['MODERATOR', 'FINANCE'],
  '/users': ['MODERATOR'],
  '/users/:id': ['MODERATOR', 'FINANCE'],
  '/feedback': ['MODERATOR'],
  '/reports': ['MODERATOR'],
  '/ratings': ['MODERATOR'],
  '/broadcast': ['MODERATOR'],
  '/withdrawals': ['FINANCE'],
  '/money': ['FINANCE'],
  '/charities': ['FINANCE'],
  '/configs': ['FINANCE'],
  '/catalog': ['SUPER_ADMIN'],
  '/maintenance': ['SUPER_ADMIN'],
  '/audit': ['SUPER_ADMIN'],
}

export function tierOf(user: UserSummary | null | undefined): AdminTier | null {
  return user?.adminRole ?? null
}

/** `/orders/4f2…` belongs to `/orders`; the dashboard is its own section. */
export function sectionOf(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return '/'
  if (segments[0] === 'users' && segments.length > 1) return '/users/:id'
  return `/${segments[0]}`
}

export function canOpenSection(tier: AdminTier | null, section: string): boolean {
  const required = SECTION_TIERS[section]
  if (required === undefined) return false
  if (tier === null) return required.length === 0
  return tier === 'SUPER_ADMIN' || required.length === 0 || required.includes(tier)
}

export function canOpenPath(tier: AdminTier | null, pathname: string): boolean {
  return canOpenSection(tier, sectionOf(pathname))
}

/** Whether this tier may read one account's dossier, from anywhere in the console. */
export function canOpenDossier(tier: AdminTier | null): boolean {
  return canOpenSection(tier, '/users/:id')
}

/** Menu keys a tier may see, so a section is never listed and then refused. */
export function visibleSections(tier: AdminTier | null): string[] {
  return Object.keys(SECTION_TIERS)
    .filter((section) => !section.endsWith('/:id'))
    .filter((section) => canOpenSection(tier, section))
}
