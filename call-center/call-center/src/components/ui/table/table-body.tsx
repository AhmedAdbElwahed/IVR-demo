"use client"

import { cn } from "@/lib/utils/cn"
import { useTableContext } from "./table-context"
import Link from "next/link";

export function TableBody<T extends Record<string, any>>() {
  const { columns, paginatedData,onRowClick,loading  } = useTableContext<T>() 

  console.log(loading);
  
    if (loading) {
    return <tbody></tbody>;  
  }

  if (paginatedData.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length}
            className="px-6 py-8 text-center text-muted-foreground"
          >
            No data available
          </td>
        </tr>
      </tbody>
    )
  }
return (
  <tbody>
    {paginatedData.map((item, index) => (
      <tr
        key={index}
        className={cn(
          "border-b border-border hover:bg-muted/50 transition-colors text-center",
          "cursor-pointer transition-all duration-150",
          "hover:bg-accent/10 hover:shadow-sm",
          index % 2 === 0 && "bg-card"
        )}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((column) => (
          <td
            key={String(column.key)}
            className={cn(
              "px-6 py-4 text-sm text-foreground whitespace-normal break-words",
              column.className
            )}
          >
            {column.key === "id" ? (<Link href={`/admin/call-details?id=${item.id}`}>{item.id}</Link>) : column.render
              ? column.render(item[column.key], item)
              : String(item[column.key])}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)
}