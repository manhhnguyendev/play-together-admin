export const formatMoney = (value: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(value)} đ`

export const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'
