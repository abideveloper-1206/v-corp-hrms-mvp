import { Card, Chip } from '@heroui/react'
import type { PayrollRecord } from '#/types'
import { formatCurrency, monthLabel } from '#/lib/utils'
import { PAYROLL_STATUS_COLOR } from '#/lib/chart-colors'

export function PayrollSummary({ monthRecords, month }: { monthRecords: Array<PayrollRecord>; month: string }) {
  const totalNet = monthRecords.reduce((sum, r) => sum + r.netPay, 0)
  const byStatus = ['Draft', 'Processing', 'Completed'] as const

  return (
    <Card>
      <Card.Header className="px-5 pt-5">
        <Card.Title>Payroll summary</Card.Title>
        <Card.Description>{monthLabel(month)}</Card.Description>
      </Card.Header>
      <Card.Content className="px-5 pb-5 pt-4">
        <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(totalNet)}</p>
        <p className="mt-1 text-xs text-muted">Total net payout across {monthRecords.length} employees</p>

        <div className="mt-5 space-y-2.5">
          {byStatus.map((status) => {
            const count = monthRecords.filter((r) => r.status === status).length
            return (
              <div key={status} className="flex items-center justify-between rounded-lg bg-default px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: PAYROLL_STATUS_COLOR[status] }} />
                  <span className="text-sm text-foreground">{status}</span>
                </div>
                <Chip size="sm" variant="soft">
                  <Chip.Label>{count}</Chip.Label>
                </Chip>
              </div>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}
