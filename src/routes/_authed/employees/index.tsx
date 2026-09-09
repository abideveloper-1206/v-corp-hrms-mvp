import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Avatar, Button, Dropdown, Skeleton, Table } from '@heroui/react'
import { Eye, MoreVertical, Pencil, Plus, Search, UserCheck2, Users, UserX } from 'lucide-react'
import { SearchBox } from '#/components/ui/SearchBox'
import { PaginationBar } from '#/components/ui/PaginationBar'
import { useEmployees, useSetEmployeeStatus } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { TableShell, Th, Td, Tr } from '#/components/ui/SimpleTable'
import { SelectField, type SelectOption } from '#/components/ui/FormFields'
import { EmployeeFormModal } from '#/components/employees/EmployeeFormModal'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { formatDate, fullName } from '#/lib/utils'
import { toast } from '#/components/ui/Toaster'
import type { Employee } from '#/types'

const searchSchema = z.object({
  q: z.string().optional(),
})

export const Route = createFileRoute('/_authed/employees/')({
  component: EmployeesPage,
  validateSearch: searchSchema,
})

const PAGE_SIZE = 8

const STATUS_FILTERS: Array<SelectOption> = [
  { id: 'all', label: 'All statuses' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'on-leave', label: 'On Leave' },
]

function EmployeesPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: employees, isLoading, isError, refetch } = useEmployees()
  const { data: departments } = useDepartments()
  const setStatusMutation = useSetEmployeeStatus()

  const [search, setSearch] = useState(q ?? '')
  const [departmentFilter, setDepartmentFilter] = useState<string | null>('all')
  const [statusFilter, setStatusFilter] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null)

  const departmentMap = useMemo(() => new Map((departments ?? []).map((d) => [d.id, d])), [departments])
  const departmentOptions: Array<SelectOption> = useMemo(
    () => [{ id: 'all', label: 'All departments' }, ...(departments ?? []).map((d) => ({ id: d.id, label: d.name }))],
    [departments],
  )

  const filtered = useMemo(() => {
    if (!employees) return []
    const term = search.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesTerm =
        !term ||
        fullName(e).toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.employeeCode.toLowerCase().includes(term)
      const matchesDept = !departmentFilter || departmentFilter === 'all' || e.departmentId === departmentFilter
      const matchesStatus = !statusFilter || statusFilter === 'all' || e.employmentStatus === statusFilter
      return matchesTerm && matchesDept && matchesStatus
    })
  }, [employees, search, departmentFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateFilters(next: Partial<{ search: string; department: string | null; status: string | null }>) {
    if (next.search !== undefined) setSearch(next.search)
    if (next.department !== undefined) setDepartmentFilter(next.department)
    if (next.status !== undefined) setStatusFilter(next.status)
    setPage(1)
  }

  async function handleConfirmStatusChange() {
    if (!statusTarget) return
    const nextStatus = statusTarget.employmentStatus === 'active' ? 'inactive' : 'active'
    try {
      await setStatusMutation.mutateAsync({ id: statusTarget.id, status: nextStatus })
      toast.success(nextStatus === 'active' ? 'Employee activated' : 'Employee deactivated')
      setStatusTarget(null)
    } catch {
      toast.danger('Could not update employee status.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage V Corp's workforce, roles, and department assignments."
        actions={
          <Button
            onPress={() => {
              setEditingEmployee(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" /> Add employee
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_180px]">
        <SearchBox value={search} onChange={(v) => updateFilters({ search: v })} placeholder="Search by name, email, or ID…" />
        <SelectField
          label="Department"
          hideLabel
          items={departmentOptions}
          selectedKey={departmentFilter}
          onSelectionChange={(k) => updateFilters({ department: k })}
        />
        <SelectField label="Status" hideLabel items={STATUS_FILTERS} selectedKey={statusFilter} onSelectionChange={(k) => updateFilters({ status: k })} />
      </div>

      {isError ? (
        <ErrorStateBlock message="We couldn't load employees. Please try again." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateBlock
          icon={employees && employees.length === 0 ? Users : Search}
          title={employees && employees.length === 0 ? 'No employees have been added yet' : 'No employees match your current search/filter'}
          description={
            employees && employees.length === 0
              ? 'Add your first employee to start building V Corp’s workforce directory.'
              : 'Try adjusting your search term or filters to find who you’re looking for.'
          }
          action={
            employees && employees.length === 0 ? (
              <Button onPress={() => setFormOpen(true)}>
                <Plus className="size-4" /> Add employee
              </Button>
            ) : (
              <Button variant="outline" onPress={() => updateFilters({ search: '', department: 'all', status: 'all' })}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <Table>
            <Table.ResizableContainer className="rounded-lg border border-separator bg-surface">
              <Table.Content aria-label="Employees" className="min-w-[900px]">
                <Table.Header>
                  <Table.Column isRowHeader id="employee" defaultWidth="2fr" minWidth={220}>
                    Employee
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="department" defaultWidth="1fr" minWidth={130}>
                    Department
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="designation" defaultWidth="1fr" minWidth={150}>
                    Designation
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="status" defaultWidth="120px" minWidth={100}>
                    Status
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="location" defaultWidth="1fr" minWidth={130}>
                    Location
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="joined" defaultWidth="120px" minWidth={110}>
                    Joined
                    <Table.ColumnResizer />
                  </Table.Column>
                  <Table.Column id="actions" defaultWidth="56px" minWidth={56}>
                    {' '}
                  </Table.Column>
                </Table.Header>
                <Table.Body items={pageItems}>
                  {(employee) => (
                    <Table.Row id={employee.id}>
                      <Table.Cell>
                        <Link to="/employees/$employeeId" params={{ employeeId: employee.id }} className="flex items-center gap-3 hover:opacity-80">
                          <Avatar size="sm">
                            <Avatar.Image src={employee.avatarUrl} alt="" />
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{fullName(employee)}</span>
                            <span className="block truncate text-xs text-muted">{employee.email}</span>
                          </span>
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-foreground">{departmentMap.get(employee.departmentId)?.name ?? '—'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-foreground">{employee.designation}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <StatusBadge status={employee.employmentStatus} />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-muted">{employee.location}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-muted">{formatDate(employee.joiningDate)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Dropdown.Trigger className="flex size-8 items-center justify-center rounded-lg text-muted outline-none hover:bg-default hover:text-foreground">
                            <MoreVertical className="size-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="bottom end" className="w-44">
                            <Dropdown.Menu
                              onAction={(key) => {
                                if (key === 'view') navigate({ to: '/employees/$employeeId', params: { employeeId: employee.id } })
                                if (key === 'edit') {
                                  setEditingEmployee(employee)
                                  setFormOpen(true)
                                }
                                if (key === 'toggle') setStatusTarget(employee)
                              }}
                            >
                              <Dropdown.Item id="view" textValue="View profile">
                                <Eye className="size-4" /> View profile
                              </Dropdown.Item>
                              <Dropdown.Item id="edit" textValue="Edit">
                                <Pencil className="size-4" /> Edit details
                              </Dropdown.Item>
                              <Dropdown.Item id="toggle" textValue="Toggle status" variant={employee.employmentStatus === 'active' ? 'danger' : 'default'}>
                                {employee.employmentStatus === 'active' ? (
                                  <>
                                    <UserX className="size-4" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck2 className="size-4" /> Activate
                                  </>
                                )}
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ResizableContainer>
          </Table>

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      <EmployeeFormModal
        isOpen={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingEmployee(null)
        }}
        employee={editingEmployee}
        departments={departments ?? []}
        employees={employees ?? []}
      />

      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget?.employmentStatus === 'active' ? 'Deactivate employee?' : 'Activate employee?'}
        description={
          statusTarget?.employmentStatus === 'active' ? (
            <>
              <strong className="font-medium text-foreground">{statusTarget ? fullName(statusTarget) : ''}</strong> will be marked inactive and
              lose access to V Corp systems. You can reactivate them at any time.
            </>
          ) : (
            <>
              <strong className="font-medium text-foreground">{statusTarget ? fullName(statusTarget) : ''}</strong> will be marked active again.
            </>
          )
        }
        confirmLabel={statusTarget?.employmentStatus === 'active' ? 'Deactivate' : 'Activate'}
        tone={statusTarget?.employmentStatus === 'active' ? 'danger' : 'primary'}
        isLoading={setStatusMutation.isPending}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  )
}
