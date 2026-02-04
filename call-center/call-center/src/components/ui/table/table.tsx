"use client";

import type { ReactNode } from "react";
import { TableProvider } from "./table-context";
import { TablePagination } from "./table-pagination";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => ReactNode;
  className?: string;
}

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  children: ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  pagination?: TablePaginationProps;
}

export function Table<T>({
  data,
  columns,
  children,
  pageSize,
  onRowClick,
  loading,
  pagination,
}: TableProps<T>) {
  return (
    <TableProvider
      data={data}
      columns={columns}
      pageSize={pageSize}
      onRowClick={onRowClick}
      loading={loading}
    >
      <div className="w-full overflow-x-auto border border-border rounded-lg">
        <table className="w-full table-fixed">
          {children}
        </table>
      </div>

      {pagination && data.length > 0 && (
        <TablePagination {...pagination} />
      )}
    </TableProvider>
  );
}