import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Avatar, Button, Dropdown, Skeleton, Table } from '@heroui/react'
import { ArrowRightCircle, FileText, MoreVertical, Wallet } from 'lucide-react'
import { usePayroll, useUpdatePayrollStatus } from '#/hooks/usePayroll'
import { useEmployees } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatCard } from '#/components/ui/StatCard'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { SelectField, type SelectOption } from '#/components/ui/FormFields'
import { SearchBox } from '#/components/ui/SearchBox'
import { PaginationBar } from '#/components/ui/PaginationBar'
import { PayslipModal } from '#/components/payroll/PayslipModal'
import { formatCurrency, fullName, monthLabel } from '#/lib/utils'
import { toast } from '#/components/ui/Toaster'
import type { PayrollRecord, PayrollStatus } from '#/types'

export const Route = createFileRoute('/_authed/payroll')({ component: PayrollPage })

const PAGE_SIZE = 8

const NEXT_STATUS: Record<PayrollStatus, PayrollStatus | null> = {
  Draft: 'Processing',
  Processing: 'Completed',
  Completed: null,
}

function PayrollPage() {
  const { data: payroll, isLoading, isError, refetch } = usePayroll()
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()
  const updateStatusMutation = useUpdatePayrollStatus()

  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e])), [employees])
  const departmentOptions: Array<SelectOption> = useMemo(
    () => [{ id: 'all', label: 'All departments' }, ...(departments ?? []).map((d) => ({ id: d.id, label: d.name }))],
    [departments],
  )

  const months = useMemo(() => Array.from(new Set((payroll ?? []).map((r) => r.month))).sort().reverse(), [payroll])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const activeMonth = selectedMonth ?? months[0] ?? null

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null)
  const [statusTarget, setStatusTarget] = useState<PayrollRecord | null>(null)

  const monthRecords = useMemo(() => (payroll ?? []).filter((r) => r.month === activeMonth), [payroll, activeMonth])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return monthRecords.filter((r) => {
      const emp = employeeMap.get(r.employeeId)
      const matchesTerm = !term || (emp && fullName(emp).toLowerCase().includes(term))
      const matchesDept = !departmentFilter || departmentFilter === 'all' || emp?.departmentId === departmentFilter
      return matchesTerm && matchesDept
    })
  }, [monthRecords, search, departmentFilter, employeeMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  // Resolve the employee's name/designation/avatar onto each row's own object (rather than
  // looking them up from `employeeMap` inside the Table.Body render callback) so the row's
  // identity changes when employee data arrives. HeroUI/react-aria-components' dynamic Table
  // collection caches rendered rows by item identity, so a lookup keyed only on unrelated outer
  // state (like a map that resolves after the initial render) can otherwise get stuck showing
  // stale/placeholder content even after the map itself is populated.
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => {
    const emp = employeeMap.get(r.employeeId)
    return { ...r, employeeName: emp ? fullName(emp) : 'Unknown', employeeDesignation: emp?.designation, employeeAvatarUrl: emp?.avatarUrl }
  })

  const totalNet = monthRecords.reduce((sum, r) => sum + r.netPay, 0)
  const completedCount = monthRecords.filter((r) => r.status === 'Completed').length

  function updateFilters(next: Partial<{ search: string; department: string | null }>) {
    if (next.search !== undefined) setSearch(next.search)
    if (next.department !== undefined) setDepartmentFilter(next.department)
    setPage(1)
  }

  async function handleConfirmStatusChange() {
    if (!statusTarget) return
    const next = NEXT_STATUS[statusTarget.status]
    if (!next) return
    try {
      await updateStatusMutation.mutateAsync({ id: statusTarget.id, status: next })
      toast.success(`Payroll moved to ${next}`)
      setStatusTarget(null)
    } catch {
      toast.danger('Could not update payroll status.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Review monthly payroll records and manage the payout workflow."
        actions={
          months.length > 0 ? (
            <SelectField
              label="Month"
              hideLabel
              className="w-44"
              items={months.map((m) => ({ id: m, label: monthLabel(m) }))}
              selectedKey={activeMonth}
              onSelectionChange={(k) => {
                setSelectedMonth(k)
                setPage(1)
              }}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[66px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total net payout" value={formatCurrency(totalNet)} icon={Wallet} tone="accent" />
          <StatCard label="Employees this month" value={String(monthRecords.length)} icon={Wallet} tone="success" />
          <StatCard label="Completed" value={`${completedCount} / ${monthRecords.length}`} icon={Wallet} tone="warning" />
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
        <SearchBox value={search} onChange={(v) => updateFilters({ search: v })} placeholder="Search employee…" />
        <SelectField label="Department" hideLabel items={departmentOptions} selectedKey={departmentFilter} onSelectionChange={(k) => updateFilters({ department: k })} />
      </div>

      {isError ? (
        <ErrorStateBlock message="We couldn't load payroll records. Please try again." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateBlock
          icon={Wallet}
          title={monthRecords.length === 0 ? 'No payroll data for this month yet' : 'No records match your search/filter'}
          description={monthRecords.length === 0 ? 'Payroll records will show up here once processed.' : 'Try adjusting your search or department filter.'}
          action={
            monthRecords.length > 0 ? (
              <Button variant="outline" onPress={() => updateFilters({ search: '', department: 'all' })}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
              <Table.ScrollContainer>
              <Table.Content aria-label="Payroll" className="min-w-[900px]">
                <Table.Header>
                  <Table.Column isRowHeader id="employee">Employee</Table.Column>
                  <Table.Column id="basic">Basic</Table.Column>
                  <Table.Column id="allowances">Allowances</Table.Column>
                  <Table.Column id="deductions">Deductions</Table.Column>
                  <Table.Column id="tax">Tax</Table.Column>
                  <Table.Column id="netPay">Net pay</Table.Column>
                  <Table.Column id="status">Status</Table.Column>
                  <Table.Column id="actions"> </Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Collection items={pageItems}>
                  {(record) => {
                    const next = NEXT_STATUS[record.status]
                    return (
                      <Table.Row id={record.id}>
                        <Table.Cell>
                          <button type="button" onClick={() => setPayslipRecord(record)} className="flex items-center gap-3 text-left hover:opacity-80">
                            <Avatar size="sm">
                              <Avatar.Image src={record.employeeAvatarUrl} alt="" />
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">{record.employeeName}</span>
                              <span className="block truncate text-xs text-muted">{record.employeeDesignation}</span>
                            </span>
                          </button>
                        </Table.Cell>
                        <Table.Cell>{formatCurrency(record.basic)}</Table.Cell>
                        <Table.Cell>{formatCurrency(record.allowances)}</Table.Cell>
                        <Table.Cell>{formatCurrency(record.deductions)}</Table.Cell>
                        <Table.Cell>{formatCurrency(record.tax)}</Table.Cell>
                        <Table.Cell>
                          <span className="font-semibold text-foreground">{formatCurrency(record.netPay)}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={record.status} />
                        </Table.Cell>
                        <Table.Cell>
                          <Dropdown>
                            <Dropdown.Trigger className="flex size-8 items-center justify-center rounded-lg text-muted outline-none hover:bg-default hover:text-foreground">
                              <MoreVertical className="size-4" />
                            </Dropdown.Trigger>
                            <Dropdown.Popover placement="bottom end" className="w-48">
                              <Dropdown.Menu
                                onAction={(key) => {
                                  if (key === 'payslip') setPayslipRecord(record)
                                  if (key === 'advance') setStatusTarget(record)
                                }}
                              >
                                <Dropdown.Item id="payslip" textValue="View payslip">
                                  <FileText className="size-4" /> View payslip
                                </Dropdown.Item>
                                {next ? (
                                  <Dropdown.Item id="advance" textValue={`Move to ${next}`}>
                                    <ArrowRightCircle className="size-4" /> {next === 'Processing' ? 'Move to Processing' : 'Mark Completed'}
                                  </Dropdown.Item>
                                ) : null}
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown>
                        </Table.Cell>
                      </Table.Row>
                    )
                  }}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
              </Table.ScrollContainer>
          </Table>

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      <PayslipModal
        isOpen={Boolean(payslipRecord)}
        onOpenChange={(open) => !open && setPayslipRecord(null)}
        record={payslipRecord}
        employee={payslipRecord ? employeeMap.get(payslipRecord.employeeId) : undefined}
      />

      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={`Move to ${statusTarget ? NEXT_STATUS[statusTarget.status] : ''}?`}
        description={
          statusTarget ? (
            <>
              This will move {employeeMap.get(statusTarget.employeeId) ? fullName(employeeMap.get(statusTarget.employeeId)!) : 'this employee'}
              &apos;s payroll for {monthLabel(statusTarget.month)} to <strong className="font-medium text-foreground">{NEXT_STATUS[statusTarget.status]}</strong>.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Confirm"
        tone="primary"
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  )
}
