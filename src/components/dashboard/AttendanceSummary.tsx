import { Card } from '@heroui/react'
import type { AttendanceRecord } from '#/types'
import { ATTENDANCE_STATUS_COLOR } from '#/lib/chart-colors'

const STATUS_ORDER = ['Present', 'Late', 'Half Day', 'On Leave', 'Absent'] as const

export function AttendanceSummary({ todayRecords }: { todayRecords: Array<AttendanceRecord> }) {
  const total = todayRecords.length || 1
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: todayRecords.filter((r) => r.status === status).length,
  }))

  return (
    <Card className="h-full">
      <Card.Header className="px-5 pt-5">
        <Card.Title>Today&apos;s attendance</Card.Title>
        <Card.Description>Status breakdown for working employees today</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-3 px-5 pb-5 pt-4">
        {counts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-2 text-sm text-foreground sm:w-28">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ATTENDANCE_STATUS_COLOR[status] }} />
              {status}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-default">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${Math.max(count > 0 ? 4 : 0, (count / total) * 100)}%`, backgroundColor: ATTENDANCE_STATUS_COLOR[status] }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{count}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  )
}
