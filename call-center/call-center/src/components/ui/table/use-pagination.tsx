import { useTableContext } from "./table-context"

export function usePagination() {
  const { pagination, setPagination, paginatedData } = useTableContext()

  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize)

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages))
    setPagination({
      ...pagination,
      currentPage: newPage,
    })
  }

  const nextPage = () => goToPage(pagination.currentPage + 1)
  const prevPage = () => goToPage(pagination.currentPage - 1)

  return {
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: pagination.currentPage < totalPages,
    hasPrevPage: pagination.currentPage > 1,
    isLoading: false,
  }
}
