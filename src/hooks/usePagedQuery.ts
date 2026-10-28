import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { TableProps } from 'antd'
import { useCallback, useState } from 'react'
import type { Paginated } from '@/api/types'

interface PagedQueryOptions<T> {
  key: readonly unknown[]
  fetcher: (paging: { page: number; pageSize: number }) => Promise<Paginated<T>>
  totalLabel: (total: number) => string
  initialPageSize?: number
}

export function usePagedQuery<T>({ key, fetcher, totalLabel, initialPageSize = 20 }: PagedQueryOptions<T>) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const query = useQuery({
    queryKey: [...key, { page, pageSize }],
    queryFn: () => fetcher({ page, pageSize }),
    placeholderData: keepPreviousData,
  })

  const resetPage = useCallback(() => setPage(1), [])

  const pagination: TableProps<T>['pagination'] = {
    current: query.data?.meta.page ?? page,
    pageSize: query.data?.meta.pageSize ?? pageSize,
    total: query.data?.meta.total ?? 0,
    showSizeChanger: true,
    showTotal: (total) => totalLabel(total),
    onChange: (nextPage, nextSize) => {
      setPage(nextPage)
      setPageSize(nextSize)
    },
  }

  return { query, pagination, resetPage }
}
