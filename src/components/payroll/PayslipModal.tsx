import { Avatar } from '@heroui/react'
import type { Employee, PayrollRecord } from '#/types'
import { FormModal } from '#/components/ui/FormModal'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { formatCurrency, formatDate, fullName, monthLabel } from '#/lib/utils'

export function PayslipModal({
  isOpen,
  onOpenChange,
  record,
  employee,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  record: PayrollRecord | null
  employee: Employee | undefined
}) {
  if (!record) return null

  const rows: Array<[string, number, 'add' | 'sub']> = [
    ['Basic salary', record.basic, 'add'],
    ['Allowances', record.allowances, 'add'],
    ['Deductions', record.deductions, 'sub'],
    ['Tax', record.tax, 'sub'],
  ]

  return (
    <FormModal isOpen={isOpen} onOpenChange={onOpenChange} title="Payslip" description={monthLabel(record.month)} size="sm">
      <div className="flex items-center gap-3">
        <Avatar size="md">
          <Avatar.Image src={employee?.avatarUrl} alt="" />
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{employee ? fullName(employee) : 'Unknown employee'}</p>
          <p className="text-xs text-muted">{employee?.designation}</p>
        </div>
        <span className="ml-auto">
          <StatusBadge status={record.status} />
        </span>
      </div>

      <div className="mt-5 space-y-2 border-t border-separator pt-4 text-sm">
        {rows.map(([label, value, kind]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted">{label}</span>
            <span className={kind === 'sub' ? 'text-danger' : 'text-foreground'}>
              {kind === 'sub' ? '– ' : ''}
              {formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-accent-soft px-3.5 py-3">
        <span className="text-sm font-semibold text-accent-soft-foreground">Net pay</span>
        <span className="text-lg font-bold text-accent-soft-foreground">{formatCurrency(record.netPay)}</span>
      </div>

      {record.processedOn ? <p className="mt-3 text-xs text-muted">Processed on {formatDate(record.processedOn)}</p> : null}
    </FormModal>
  )
}
