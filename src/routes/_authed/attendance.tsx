import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Avatar, Button, Skeleton, Table } from '@heroui/react'
import { CalendarClock } from 'lucide-react'
import { useAttendance } from '#/hooks/useAttendance'
import { useEmployees } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { DatePickerField, SelectField, type SelectOption } from '#/components/ui/FormFields'
import { SearchBox } from '#/components/ui/SearchBox'
import { PaginationBar } from '#/components/ui/PaginationBar'
import { formatDate, fullName } from '#/lib/utils'
import { ATTENDANCE_STATUS_COLOR } from '#/lib/chart-colors'
import type { AttendanceStatus } from '#/types'

export const Route = createFileRoute('/_authed/attendance')({ component: AttendancePage })

const PAGE_SIZE = 10
const TODAY = '2026-09-08'

const STATUS_OPTIONS: Array<AttendanceStatus> = ['Present', 'Late', 'Half Day', 'On Leave', 'Absent', 'Weekend']
const STATUS_FILTERS: Array<SelectOption> = [{ id: 'all', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ id: s, label: s }))]

function AttendancePage() {
  const { data: attendance, isLoading, isError, refetch } = useAttendance()
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()

  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e])), [employees])
  const departmentMap = useMemo(() => new Map((departments ?? []).map((d) => [d.id, d])), [departments])
  const departmentOptions: Array<SelectOption> = useMemo(
    () => [{ id: 'all', label: 'All departments' }, ...(departments ?? []).map((d) => ({ id: d.id, label: d.name }))],
    [departments],
  )

  const [date, setDate] = useState(TODAY)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string | null>('all')
  const [statusFilter, setStatusFilter] = useState<string | null>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!attendance) return []
    const term = search.trim().toLowerCase()
    return attendance.filter((r) => {
      const emp = employeeMap.get(r.employeeId)
      const matchesDate = !date || r.date === date
      const matchesTerm = !term || (emp && fullName(emp).toLowerCase().includes(term))
      const matchesDept = !departmentFilter || departmentFilter === 'all' || emp?.departmentId === departmentFilter
      const matchesStatus = !statusFilter || statusFilter === 'all' || r.status === statusFilter
      return matchesDate && matchesTerm && matchesDept && matchesStatus
    })
  }, [attendance, date, search, departmentFilter, statusFilter, employeeMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateFilters(next: Partial<{ date: string; search: string; department: string | null; status: string | null }>) {
    if (next.date !== undefined) setDate(next.date)
    if (next.search !== undefined) setSearch(next.search)
    if (next.department !== undefined) setDepartmentFilter(next.department)
    if (next.status !== undefined) setStatusFilter(next.status)
    setPage(1)
  }

  const summary = STATUS_OPTIONS.map((status) => ({ status, count: filtered.filter((r) => r.status === status).length }))

  return (
    <div>
      <PageHeader title="Attendance" description="Track daily check-ins, check-outs, and attendance status across V Corp." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[160px_1fr_180px_160px]">
        <DatePickerField label="Date" hideLabel value={date} onChange={(v) => updateFilters({ date: v })} />
        <SearchBox value={search} onChange={(v) => updateFilters({ search: v })} placeholder="Search employee…" />
        <SelectField label="Department" hideLabel items={departmentOptions} selectedKey={departmentFilter} onSelectionChange={(k) => updateFilters({ department: k })} />
        <SelectField label="Status" hideLabel items={STATUS_FILTERS} selectedKey={statusFilter} onSelectionChange={(k) => updateFilters({ status: k })} />
      </div>

      {!isLoading && filtered.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {summary
            .filter((s) => s.count > 0)
            .map((s) => (
              <span key={s.status} className="flex items-center gap-1.5 rounded-md border border-separator bg-surface px-2.5 py-1 text-xs text-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: ATTENDANCE_STATUS_COLOR[s.status] }} />
                {s.status} <span className="font-semibold">{s.count}</span>
              </span>
            ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorStateBlock message="We couldn't load attendance records. Please try again." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateBlock
          icon={CalendarClock}
          title={attendance && attendance.length === 0 ? 'No attendance data available yet' : 'No records match your current filters'}
          description={
            attendance && attendance.length === 0
              ? 'Attendance records will show up here once available.'
              : 'Try a different date, or adjust your search and filters.'
          }
          action={
            <Button variant="outline" onPress={() => updateFilters({ date: TODAY, search: '', department: 'all', status: 'all' })}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <Table.ResizableContainer className="rounded-lg border border-separator bg-surface">
              <Table.Content aria-label="Attendance" className="min-w-[900px]">
                <Table.Header>
                  <Table.Column isRowHeader id="employee" defaultWidth="2fr" minWidth={220}>Employee<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="department" defaultWidth="1fr" minWidth={130}>Department<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="date" defaultWidth="120px" minWidth={110}>Date<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="checkIn" defaultWidth="100px" minWidth={90}>Check-in<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="checkOut" defaultWidth="100px" minWidth={90}>Check-out<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="hours" defaultWidth="80px" minWidth={70}>Hours<Table.ColumnResizer /></Table.Column>
                  <Table.Column id="status" defaultWidth="120px" minWidth={100}>Status<Table.ColumnResizer /></Table.Column>
                </Table.Header>
                <Table.Body items={pageItems}>
                  {(record) => {
                    const emp = employeeMap.get(record.employeeId)
                    return (
                      <Table.Row id={record.id}>
                        <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <Avatar.Image src={emp?.avatarUrl} alt="" />
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{emp ? fullName(emp) : 'Unknown'}</span>
                      </div>
                    </Table.Cell>
                        <Table.Cell>
                      <span className="text-sm text-muted">{emp ? departmentMap.get(emp.departmentId)?.name ?? '—' : '—'}</span>
                    </Table.Cell>
                        <Table.Cell>
                      <span className="whitespace-nowrap text-sm text-muted">{formatDate(record.date)}</span>
                    </Table.Cell>
                        <Table.Cell>
                      <span className="text-sm text-muted">{record.checkIn ?? '—'}</span>
                    </Table.Cell>
                        <Table.Cell>
                      <span className="text-sm text-muted">{record.checkOut ?? '—'}</span>
                    </Table.Cell>
                        <Table.Cell>
                      <span className="text-sm text-muted">{record.workingHours || '—'}</span>
                    </Table.Cell>
                        <Table.Cell>
                      <StatusBadge status={record.status} />
                        </Table.Cell>
                      </Table.Row>
                    )
                  }}
                </Table.Body>
              </Table.Content>
            </Table.ResizableContainer>
          </Table>

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
