"use client"
import { cn } from "@/lib/utils/cn"
import { useTableContext } from "./table-context"
import { ChevronDown, ChevronUp } from "lucide-react"


export function TableHead() {
  const { columns, sortedBy, sortOrder, onSort } = useTableContext()

  return (
    <thead className="border-b border-border bg-muted/50 whitespace-nowrap">
      <tr>
        {columns.map((column) => (
          <th
            key={String(column.key)}
            onClick={() => column.sortable && onSort(column.key)}
            className={cn(
              "px-6 py-3 text-center text-sm font-semibold text-muted-foreground truncate",
              column.sortable && "cursor-pointer hover:bg-muted/70 transition-colors",
              column.className
            )}
          >
            <div className="flex justify-center items-center gap-2">
              {column.label}
              {column.sortable &&
                sortedBy === column.key &&
                (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}
