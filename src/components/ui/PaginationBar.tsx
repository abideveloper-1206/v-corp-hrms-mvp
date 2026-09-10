import { Pagination } from '@heroui/react'

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return (
    <Pagination className="mt-4">
      <Pagination.Summary className="shrink-0 self-center whitespace-nowrap text-sm text-muted">
        Showing {rangeStart}–{rangeEnd} of {totalItems}
      </Pagination.Summary>
      <Pagination.Content className="flex items-center gap-1 self-center">
        <Pagination.Item>
          <Pagination.Previous isDisabled={currentPage <= 1} onPress={() => onPageChange(currentPage - 1)} className="whitespace-nowrap">
            <Pagination.PreviousIcon />
            Previous
          </Pagination.Previous>
        </Pagination.Item>
        <Pagination.Item>
          <span className="whitespace-nowrap px-2 text-sm text-muted">
            Page {currentPage} of {totalPages}
          </span>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next isDisabled={currentPage >= totalPages} onPress={() => onPageChange(currentPage + 1)} className="whitespace-nowrap">
            Next
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  )
}
