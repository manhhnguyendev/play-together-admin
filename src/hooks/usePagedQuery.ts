import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { TableProps } from 'antd'
import { useCallback, useMemo, useState, type Key } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Paginated } from '@/api/types'

/**
 * `sort` is the column the API was asked to order by. The ops endpoints only
 * order newest-first, so a column offers one direction and a second click clears it.
 */
export interface Paging {
  page: number
  pageSize: number
  sort?: string
}

/** What a fetcher is handed: paging, the active sort column and the URL filters. */
export interface TableQuery<K extends string> extends Paging {
  filters: Record<K, string | undefined>
}

interface PagedQueryOptions<T, K extends string, TPage extends Paginated<T>> {
  key: readonly unknown[]
  /**
   * The page type is a parameter because some ops endpoints answer with more
   * than `{items, meta}` — the ledger carries totals, escrows carry totalHeld.
   */
  fetcher: (query: TableQuery<K>) => Promise<TPage>
  totalLabel: (total: number) => string
  initialPageSize?: number
  /**
   * Filter names kept in the address bar. A link to
   * `/orders?status=DISPUTED&page=2` then reopens exactly that view, which is
   * what makes the console shareable in a support conversation.
   */
  filterNames?: readonly K[]
}

const positiveInt = (raw: string | null, fallback: number): number => {
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function usePagedQuery<T, K extends string = never, TPage extends Paginated<T> = Paginated<T>>({
  key,
  fetcher,
  totalLabel,
  initialPageSize = 20,
  filterNames = [],
}: PagedQueryOptions<T, K, TPage>) {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = positiveInt(searchParams.get('page'), 1)
  const pageSize = positiveInt(searchParams.get('size'), initialPageSize)
  const sort = searchParams.get('sort') ?? undefined

  const filters = useMemo(() => {
    const read: Record<string, string | undefined> = {}
    for (const name of filterNames) read[name] = searchParams.get(name) ?? undefined
    return read as Record<K, string | undefined>
    // `filterNames` is a literal at every call site, so this re-runs per URL change.
  }, [searchParams, filterNames])

  const query = useQuery({
    queryKey: [...key, { page, pageSize, sort, filters }],
    queryFn: () => fetcher({ page, pageSize, sort, filters }),
    placeholderData: keepPreviousData,
  })

  /**
   * One write per interaction: two updates would each start from the same stale
   * query string, and the second would erase what the first wrote.
   */
  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams)
      for (const [name, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(name)
        else next.set(name, value)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const pagination: TableProps<T>['pagination'] = {
    current: query.data?.meta.page ?? page,
    pageSize: query.data?.meta.pageSize ?? pageSize,
    total: query.data?.meta.total ?? 0,
    showSizeChanger: true,
    showTotal: (total) => totalLabel(total),
    onChange: (nextPage, nextSize) =>
      patch({
        page: nextPage > 1 ? String(nextPage) : null,
        size: nextSize !== initialPageSize ? String(nextSize) : null,
      }),
  }

  const onTableChange = useCallback<NonNullable<TableProps<T>['onChange']>>(
    (_pagination, _tableFilters, sorter) => {
      const active = Array.isArray(sorter) ? sorter[0] : sorter
      const column = active?.columnKey ?? active?.field
      if (column === undefined || column === null) return
      patch({ sort: active?.order ? String(column) : null, page: null })
    },
    [patch],
  )

  /** Which of the sortable columns currently carries the order. */
  const sortOrderOf = (column: string) => (sort === column ? ('descend' as const) : undefined)

  const resetPage = useCallback(() => patch({ page: null }), [patch])

  /** Changing a filter always starts over on page one. */
  const setFilters = useCallback(
    (changes: Record<string, string | null | undefined>) =>
      patch({
        ...Object.fromEntries(
          Object.entries(changes).map(([name, value]) => [name, value ?? null]),
        ),
        page: null,
      }),
    [patch],
  )

  const setFilter = useCallback(
    (name: string, value: string | null | undefined) => patch({ [name]: value ?? null, page: null }),
    [patch],
  )

  const clearFilters = useCallback(
    () => patch({ ...Object.fromEntries(filterNames.map((name) => [name, null])), page: null }),
    [patch, filterNames],
  )

  const [selected, setSelected] = useState<{ keys: Key[]; rows: T[] }>({ keys: [], rows: [] })
  const selection: TableProps<T>['rowSelection'] = {
    selectedRowKeys: selected.keys,
    // Keys chosen on page one, and the rows behind them, must survive a jump to
    // page three — the ledger footer needs the amounts, not just the ids.
    preserveSelectedRowKeys: true,
    onChange: (keys, rows) => setSelected({ keys, rows: rows as T[] }),
  }
  const clearSelection = useCallback(() => setSelected({ keys: [], rows: [] }), [])

  return {
    query,
    pagination,
    resetPage,
    filters,
    setFilter,
    setFilters,
    clearFilters,
    onTableChange,
    sortOrderOf,
    selection,
    selectedRowKeys: selected.keys,
    selectedRows: selected.rows,
    clearSelection,
  }
}
