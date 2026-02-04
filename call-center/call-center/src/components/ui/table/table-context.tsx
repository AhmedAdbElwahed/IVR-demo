"use client"

import React, { createContext, useContext, type ReactNode } from "react"

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], item: T) => ReactNode
  className?: string
}

interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
}

interface TableContextType<T> {
  data: T[]
  columns: Column<T>[]
  sortedBy: keyof T | null
  sortOrder: "asc" | "desc"
  onSort: (key: keyof T) => void
  pagination: PaginationState
  setPagination: (state: PaginationState) => void
  paginatedData: T[]
  onRowClick?: (row: T) => void
  loading?: boolean 
}

const TableContext = createContext<TableContextType<any> | undefined>(undefined)

export const useTableContext = <T,>() => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error("Table compound components must be used within <Table>")
  }
  return context as TableContextType<T>
}

interface TableProviderProps<T> {
  data: T[]
  columns: Column<T>[]
  children: ReactNode
  pageSize?: number
  onRowClick?: (row: T) => void
  loading?: boolean 
}

export function TableProvider<T>({ data, columns, children, pageSize = 10,onRowClick,loading}: TableProviderProps<T>) {
  const [sortedBy, setSortedBy] = React.useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [pagination, setPagination] = React.useState<PaginationState>({
    currentPage: 1,
    pageSize,
    totalItems: data.length,
  })

  const handleSort = (key: keyof T) => {
    if (sortedBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortedBy(key)
      setSortOrder("asc")
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortedBy) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortedBy]
      const bValue = b[sortedBy]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [data, sortedBy, sortOrder])

  const paginatedData = React.useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, pagination.currentPage, pagination.pageSize])

  const value: TableContextType<T> = {
    data,
    columns,
    sortedBy,
    sortOrder,
    onSort: handleSort,
    pagination: {
      ...pagination,
      totalItems: sortedData.length,
    },
    setPagination,
    paginatedData,
    onRowClick,
    loading
  }

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}
