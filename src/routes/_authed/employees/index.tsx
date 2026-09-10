import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Avatar, Button, Dropdown, Skeleton, Table, type TableSortDirection } from '@heroui/react'
import { Eye, MoreVertical, Pencil, Plus, Search, UserCheck2, Users, UserX } from 'lucide-react'
import { SearchBox } from '#/components/ui/SearchBox'
import { PaginationBar } from '#/components/ui/PaginationBar'
import { useEmployees, useSetEmployeeStatus } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { SelectField, type SelectOption } from '#/components/ui/FormFields'
import { EmployeeFormModal } from '#/components/employees/EmployeeFormModal'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { formatDate, fullName } from '#/lib/utils'
import { toast } from '#/components/ui/Toaster'
import type { Employee } from '#/types'

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'on-leave']).optional(),
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
  const { q, status } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: employees, isLoading, isError, refetch } = useEmployees()
  const { data: departments } = useDepartments()
  const setStatusMutation = useSetEmployeeStatus()

  const [search, setSearch] = useState(q ?? '')
  const [departmentFilter, setDepartmentFilter] = useState<string | null>('all')
  const [statusFilter, setStatusFilter] = useState<string | null>(status ?? 'all')
  const [page, setPage] = useState(1)
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: TableSortDirection }>({
    column: 'employee',
    direction: 'ascending',
  })
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

  // Resolve the department name onto each row's own object (rather than looking it up from
  // `departmentMap` inside the Table.Body render callback) so the row's identity changes when
  // department data arrives. HeroUI/react-aria-components' dynamic Table collection caches
  // rendered rows by item identity, so a lookup keyed only on unrelated outer state (like a map
  // that resolves after the initial render) can otherwise get stuck showing stale/placeholder
  // content even after the map itself is populated.
  const sorted = useMemo(() => {
    const withDeptName = filtered.map((e) => ({ ...e, departmentName: departmentMap.get(e.departmentId)?.name ?? '—' }))
    const { column, direction } = sortDescriptor
    const sign = direction === 'descending' ? -1 : 1
    return withDeptName.sort((a, b) => {
      let cmp = 0
      switch (column) {
        case 'employee':
          cmp = fullName(a).localeCompare(fullName(b))
          break
        case 'department':
          cmp = a.departmentName.localeCompare(b.departmentName)
          break
        case 'designation':
          cmp = a.designation.localeCompare(b.designation)
          break
        case 'status':
          cmp = a.employmentStatus.localeCompare(b.employmentStatus)
          break
        case 'location':
          cmp = a.location.localeCompare(b.location)
          break
        case 'joined':
          cmp = a.joiningDate.localeCompare(b.joiningDate)
          break
      }
      return cmp * sign
    })
  }, [filtered, departmentMap, sortDescriptor])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Employees"
                  className="min-w-[900px]"
                  sortDescriptor={sortDescriptor}
                  onSortChange={(d) => setSortDescriptor(d as { column: string; direction: TableSortDirection })}
                >
                <Table.Header>
                  <Table.Column isRowHeader id="employee" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Employee</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="department" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Department</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="designation" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Designation</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="status" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Status</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="location" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Location</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="joined" allowsSorting>
                    {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Joined</Table.SortableColumnHeader>}
                  </Table.Column>
                  <Table.Column id="actions"> </Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Collection items={pageItems}>
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
                        <span className="text-sm text-foreground">{employee.departmentName}</span>
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
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
              </Table.ScrollContainer>
          </Table>

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
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
