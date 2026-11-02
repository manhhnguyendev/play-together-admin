import { DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface DateRangeFilterProps {
  from?: string
  to?: string
  onChange: (range: { from: string | null; to: string | null }) => void
}

/**
 * Day granularity, written as the first and last instant of those days: the API
 * bounds are inclusive, so `to` has to cover the whole chosen day.
 */
export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const value: [Dayjs, Dayjs] | null = from && to ? [dayjs(from), dayjs(to)] : null

  return (
    <RangePicker
      allowClear
      value={value}
      format="DD/MM/YYYY"
      placeholder={['Từ ngày', 'Đến ngày']}
      onChange={(dates) => {
        const [start, end] = dates ?? []
        onChange({
          from: start ? start.startOf('day').toISOString() : null,
          to: end ? end.endOf('day').toISOString() : null,
        })
      }}
    />
  )
}
