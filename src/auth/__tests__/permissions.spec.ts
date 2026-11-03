import { describe, expect, it } from 'vitest'

import {
  canOpenDossier,
  canOpenPath,
  canOpenSection,
  sectionOf,
  tierOf,
  visibleSections,
} from '@/auth/permissions'
import type { UserSummary } from '@/api/types'

const user = (adminRole: UserSummary['adminRole']): UserSummary =>
  ({ adminRole }) as UserSummary

describe('sectionOf', () => {
  it('folds a detail route back onto its section', () => {
    expect(sectionOf('/orders/4f2c1')).toBe('/orders')
    expect(sectionOf('/money/wallet/9')).toBe('/money')
    expect(sectionOf('/withdrawals')).toBe('/withdrawals')
  })

  it('keeps the dashboard and the one-account dossier apart', () => {
    expect(sectionOf('')).toBe('/')
    expect(sectionOf('/')).toBe('/')
    expect(sectionOf('/users')).toBe('/users')
    expect(sectionOf('/users/4f2c1')).toBe('/users/:id')
  })
})

describe('canOpenSection', () => {
  it('gives the moderator the people-facing queues but never the money ones', () => {
    expect(canOpenSection('MODERATOR', '/users')).toBe(true)
    expect(canOpenSection('MODERATOR', '/reports')).toBe(true)
    expect(canOpenSection('MODERATOR', '/withdrawals')).toBe(false)
    expect(canOpenSection('MODERATOR', '/configs')).toBe(false)
    expect(canOpenSection('MODERATOR', '/audit')).toBe(false)
  })

  it('gives finance the money sections but not the moderation queues', () => {
    expect(canOpenSection('FINANCE', '/money')).toBe(true)
    expect(canOpenSection('FINANCE', '/withdrawals')).toBe(true)
    expect(canOpenSection('FINANCE', '/feedback')).toBe(false)
    expect(canOpenSection('FINANCE', '/catalog')).toBe(false)
  })

  it('treats the super admin as a wildcard', () => {
    ;['/users', '/money', '/catalog', '/audit', '/maintenance'].forEach((section) => {
      expect(canOpenSection('SUPER_ADMIN', section)).toBe(true)
    })
  })

  it('leaves an untiered admin account only the dashboard', () => {
    expect(canOpenSection(null, '/')).toBe(true)
    expect(canOpenSection(null, '/users')).toBe(false)
    expect(canOpenSection(null, '/money')).toBe(false)
  })

  it('refuses a section the console does not know', () => {
    expect(canOpenSection('SUPER_ADMIN', '/something-new')).toBe(false)
  })
})

describe('canOpenPath', () => {
  it('applies the section rule to a concrete url', () => {
    expect(canOpenPath('FINANCE', '/orders/4f2c1')).toBe(true)
    expect(canOpenPath('MODERATOR', '/withdrawals/4f2c1/approve')).toBe(false)
  })
})

describe('dossier access', () => {
  it('lets both working tiers open one account, because payouts need the wallet', () => {
    expect(canOpenDossier('MODERATOR')).toBe(true)
    expect(canOpenDossier('FINANCE')).toBe(true)
    expect(canOpenDossier(null)).toBe(false)
  })
})

describe('visibleSections', () => {
  it('never lists the /users/:id helper as its own menu entry', () => {
    expect(visibleSections('MODERATOR')).not.toContain('/users/:id')
    expect(visibleSections('SUPER_ADMIN')).not.toContain('/users/:id')
  })

  it('lists exactly what the tier can open', () => {
    expect(visibleSections('MODERATOR').sort()).toEqual(
      [
        '/',
        '/broadcast',
        '/feedback',
        '/orders',
        '/ratings',
        '/reports',
        '/users',
      ].sort(),
    )
    expect(visibleSections('FINANCE').sort()).toEqual(
      ['/', '/charities', '/configs', '/money', '/orders', '/withdrawals'].sort(),
    )
    expect(visibleSections(null)).toEqual(['/'])
  })
})

describe('tierOf', () => {
  it('reads the tier off the account and treats anyone else as none', () => {
    expect(tierOf(user('FINANCE'))).toBe('FINANCE')
    expect(tierOf(user(null))).toBeNull()
    expect(tierOf(undefined)).toBeNull()
  })
})
