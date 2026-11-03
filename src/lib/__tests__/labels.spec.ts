import { describe, expect, it } from 'vitest'

import {
  ACCOUNT_TYPE_LABELS,
  ADMIN_TIER_LABELS,
  BEHAVIOR_EVENT_LABELS,
  CLOSE_REASON_LABELS,
  LEDGER_TYPE_LABELS,
  ORDER_PARTY_LABELS,
  STATUS_META,
  USER_ROLE_LABELS,
  adminTierLabel,
  formatBasisPoints,
  labelOf,
  statusLabel,
  statusMeta,
  statusOptions,
} from '@/lib/labels'

const MAPS: [string, Record<string, string>][] = [
  ['ADMIN_TIER_LABELS', ADMIN_TIER_LABELS],
  ['USER_ROLE_LABELS', USER_ROLE_LABELS],
  ['LEDGER_TYPE_LABELS', LEDGER_TYPE_LABELS],
  ['ACCOUNT_TYPE_LABELS', ACCOUNT_TYPE_LABELS],
  ['CLOSE_REASON_LABELS', CLOSE_REASON_LABELS],
  ['ORDER_PARTY_LABELS', ORDER_PARTY_LABELS],
  ['BEHAVIOR_EVENT_LABELS', BEHAVIOR_EVENT_LABELS],
]

describe('plain-language labels', () => {
  it.each(MAPS)('%s never shows the raw code as its own label', (_name, map) => {
    Object.entries(map).forEach(([key, label]) => {
      expect(label).not.toBe(key)
      expect(label).not.toMatch(/^[A-Z][A-Z0-9_]*$/)
    })
  })

  it('covers every close reason the API can put on an order', () => {
    // Mirrors orderCloseReasonEnum in play-together-be/src/db/schema/enums.ts.
    ;['REJECTED_BY_PLAYER', 'CANCELLED_BY_HIRER', 'EXPIRED', 'INTERRUPTED_BY_ADMIN'].forEach(
      (reason) => {
        expect(CLOSE_REASON_LABELS[reason]).toBeTypeOf('string')
      },
    )
  })

  it('covers every ledger movement the money page lists', () => {
    // Mirrors ledgerTypeEnum in play-together-be/src/db/schema/enums.ts.
    ;[
      'DEPOSIT',
      'WITHDRAWAL',
      'ESCROW_HOLD',
      'ESCROW_RELEASE',
      'ESCROW_REFUND',
      'ORDER_EARNING',
      'PLATFORM_FEE',
      'DONATION',
      'REPORT_REFUND',
      'MAINTENANCE_REFUND',
      'CHARITY_WITHDRAWAL',
      'ADJUSTMENT',
    ].forEach((type) => {
      expect(LEDGER_TYPE_LABELS[type]).toBeTypeOf('string')
    })
  })

  it('labels the whole order lifecycle, not only the states a queue shows', () => {
    ;['PROPOSED', 'SCHEDULED', 'LIVE', 'DISPUTED', 'ENDED_EARLY', 'SETTLED', 'CLOSED'].forEach(
      (status) => {
        expect(STATUS_META[status]?.label).toBeTypeOf('string')
      },
    )
  })
})

describe('labelOf', () => {
  it('falls back to the raw value so an unknown code is visible, not hidden', () => {
    expect(labelOf(ORDER_PARTY_LABELS, 'HIRER')).toBe('Bên thuê')
    expect(labelOf(ORDER_PARTY_LABELS, 'SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })

  it('prints a dash instead of an empty cell', () => {
    expect(labelOf(ORDER_PARTY_LABELS, null)).toBe('—')
    expect(labelOf(ORDER_PARTY_LABELS, undefined)).toBe('—')
  })
})

describe('adminTierLabel', () => {
  it('says the account has no tier rather than leaving it blank', () => {
    expect(adminTierLabel('FINANCE')).toBe('Tài chính')
    expect(adminTierLabel(null)).toBe('Chưa phân quyền')
    expect(adminTierLabel('UNKNOWN_TIER')).toBe('UNKNOWN_TIER')
  })
})

describe('statusMeta', () => {
  it('lets a money table give its own meaning to the same word', () => {
    expect(statusMeta('SETTLED').label).toBe('Hoàn thành')
    expect(statusMeta('SETTLED', 'escrow').label).toBe('Đã tất toán')
    expect(statusMeta('SUCCEEDED', 'deposit').label).toBe('Nạp thành công')
  })

  it('shows the raw status when nobody labelled it, and a dash when there is none', () => {
    expect(statusMeta('SOMETHING_NEW').label).toBe('SOMETHING_NEW')
    expect(statusLabel(null)).toBe('—')
    expect(statusLabel(undefined)).toBe('—')
  })

  it('builds filter options in the same words the table cells use', () => {
    expect(statusOptions(['PENDING', 'APPROVED'])).toEqual([
      { value: 'PENDING', label: 'Chờ xử lý' },
      { value: 'APPROVED', label: 'Đã duyệt' },
    ])
  })
})

describe('formatBasisPoints', () => {
  it('turns the stored basis points into the percentage an operator reads', () => {
    expect(formatBasisPoints(1000)).toBe('10%')
    expect(formatBasisPoints(1500)).toBe('15%')
    expect(formatBasisPoints(25)).toBe('0,25%')
    expect(formatBasisPoints(123)).toBe('1,23%')
  })

  it('keeps every fee the API can store recoverable from the label', () => {
    // orders.fee_bps is CHECK'd 0..5000 and is any integer, so a rounded label
    // is a percentage the money behind the order does not add up to.
    for (let bps = 0; bps <= 5000; bps += 1) {
      const shown = Number(formatBasisPoints(bps).replace('%', '').replace(',', '.'))
      expect(Math.round(shown * 100)).toBe(bps)
    }
  })
})
