import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Avatar, Button, Card, Skeleton, Table, Tabs } from '@heroui/react'
import { ArrowLeft, Briefcase, Building2, Calendar, Mail, MapPin, Pencil, Phone, ShieldAlert } from 'lucide-react'
import { useEmployee, useEmployees, useSetEmployeeStatus } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { useAttendance } from '#/hooks/useAttendance'
import { useLeaveBalances, useLeaveRequests } from '#/hooks/useLeave'
import { usePayroll } from '#/hooks/usePayroll'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { EmployeeFormModal } from '#/components/employees/EmployeeFormModal'
import { formatCurrency, formatDate, fullName } from '#/lib/utils'
import { toast } from '#/components/ui/Toaster'

export const Route = createFileRoute('/_authed/employees/$employeeId')({ component: EmployeeProfilePage })

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

function EmployeeProfilePage() {
  const { employeeId } = Route.useParams()
  const navigate = useNavigate()
  const { data: employee, isLoading } = useEmployee(employeeId)
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()
  const { data: attendance } = useAttendance()
  const { data: leaveRequests } = useLeaveRequests()
  const { data: leaveBalances } = useLeaveBalances()
  const { data: payroll } = usePayroll()
  const setStatusMutation = useSetEmployeeStatus()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const department = departments?.find((d) => d.id === employee?.departmentId)
  const manager = employees?.find((e) => e.id === employee?.managerId)

  const myAttendance = useMemo(
    () => (attendance ?? []).filter((r) => r.employeeId === employeeId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [attendance, employeeId],
  )
  const myLeaveRequests = useMemo(
    () => (leaveRequests ?? []).filter((r) => r.employeeId === employeeId).sort((a, b) => (a.appliedOn < b.appliedOn ? 1 : -1)),
    [leaveRequests, employeeId],
  )
  const myLeaveBalances = useMemo(() => (leaveBalances ?? []).filter((b) => b.employeeId === employeeId), [leaveBalances, employeeId])
  const myPayroll = useMemo(
    () => (payroll ?? []).filter((r) => r.employeeId === employeeId).sort((a, b) => (a.month < b.month ? 1 : -1)),
    [payroll, employeeId],
  )

  async function handleToggleStatus() {
    if (!employee) return
    const nextStatus = employee.employmentStatus === 'active' ? 'inactive' : 'active'
    try {
      await setStatusMutation.mutateAsync({ id: employee.id, status: nextStatus })
      toast.success(nextStatus === 'active' ? 'Employee activated' : 'Employee deactivated')
      setConfirmOpen(false)
    } catch {
      toast.danger('Could not update employee status.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Employee not found</p>
        <p className="mt-1 text-sm text-muted">This employee may have been removed.</p>
        <Button className="mt-4" variant="outline" onPress={() => navigate({ to: '/employees' })}>
          Back to employees
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link to="/employees" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to employees
      </Link>

      <div className="rounded-lg border border-separator bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <Avatar.Image src={employee.avatarUrl} alt="" />
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{fullName(employee)}</h1>
                <StatusBadge status={employee.employmentStatus} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {employee.designation} · {department?.name ?? 'Unassigned'} · {employee.employeeCode}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onPress={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant={employee.employmentStatus === 'active' ? 'danger-soft' : 'primary'} onPress={() => setConfirmOpen(true)}>
              <ShieldAlert className="size-4" /> {employee.employmentStatus === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs className="mt-6" defaultSelectedKey="overview">
        <Tabs.ListContainer className="border-b border-separator">
          <Tabs.List>
            <Tabs.Tab id="overview">
              Overview
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="attendance">
              Attendance
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="leave">
              Leave
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="payroll">
              Payroll
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="overview" className="pt-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="rounded-lg border border-separator bg-surface p-5 shadow-none">
              <Card.Header>
                <Card.Title className="mb-1 text-sm font-semibold text-foreground">Contact information</Card.Title>
              </Card.Header>
              <Card.Content className="divide-y divide-separator">
                <InfoRow icon={Mail} label="Email" value={employee.email} />
                <InfoRow icon={Phone} label="Phone" value={employee.phone} />
                <InfoRow icon={MapPin} label="Address" value={employee.address} />
                <InfoRow icon={MapPin} label="Location" value={employee.location} />
              </Card.Content>
            </Card>
            <Card className="rounded-lg border border-separator bg-surface p-5 shadow-none">
              <Card.Header>
                <Card.Title className="mb-1 text-sm font-semibold text-foreground">Employment</Card.Title>
              </Card.Header>
              <Card.Content className="divide-y divide-separator">
                <InfoRow icon={Building2} label="Department" value={department?.name ?? '—'} />
                <InfoRow icon={Briefcase} label="Designation" value={employee.designation} />
                <InfoRow icon={Briefcase} label="Reporting manager" value={manager ? fullName(manager) : 'No manager assigned'} />
                <InfoRow icon={Calendar} label="Joining date" value={formatDate(employee.joiningDate)} />
              </Card.Content>
            </Card>
            <Card className="rounded-lg border border-separator bg-surface p-5 shadow-none">
              <Card.Header>
                <Card.Title className="mb-1 text-sm font-semibold text-foreground">Personal & emergency</Card.Title>
              </Card.Header>
              <Card.Content className="divide-y divide-separator">
                <InfoRow icon={Calendar} label="Date of birth" value={formatDate(employee.dateOfBirth)} />
                <InfoRow icon={Briefcase} label="Gender" value={employee.gender} />
                <InfoRow icon={Phone} label="Emergency contact" value={`${employee.emergencyContactName} · ${employee.emergencyContactPhone}`} />
                <InfoRow icon={Briefcase} label="Base salary" value={`${formatCurrency(employee.baseSalary)} / month`} />
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="attendance" className="pt-5">
          {myAttendance.length === 0 ? (
            <p className="rounded-lg border border-separator bg-surface px-4 py-10 text-center text-sm text-muted">No attendance records yet.</p>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Attendance">
                  <Table.Header>
                    <Table.Column isRowHeader id="date">Date</Table.Column>
                    <Table.Column id="checkIn">Check-in</Table.Column>
                    <Table.Column id="checkOut">Check-out</Table.Column>
                    <Table.Column id="hours">Hours</Table.Column>
                    <Table.Column id="status">Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                  <Table.Collection items={myAttendance.slice(0, 15)}>
                    {(record) => (
                      <Table.Row id={record.id}>
                        <Table.Cell>{formatDate(record.date)}</Table.Cell>
                        <Table.Cell>{record.checkIn ?? '—'}</Table.Cell>
                        <Table.Cell>{record.checkOut ?? '—'}</Table.Cell>
                        <Table.Cell>{record.workingHours || '—'}</Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={record.status} />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="leave" className="pt-5">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {myLeaveBalances.map((balance) => (
              <div key={balance.leaveType} className="rounded-lg border border-separator bg-surface p-3.5">
                <p className="text-xs text-muted">{balance.leaveType}</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {balance.allocated - balance.used - balance.pending}
                  <span className="text-xs font-normal text-muted"> / {balance.allocated} left</span>
                </p>
              </div>
            ))}
          </div>
          {myLeaveRequests.length === 0 ? (
            <p className="rounded-lg border border-separator bg-surface px-4 py-10 text-center text-sm text-muted">No leave requests yet.</p>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Leave requests">
                  <Table.Header>
                    <Table.Column isRowHeader id="type">Type</Table.Column>
                    <Table.Column id="dates">Dates</Table.Column>
                    <Table.Column id="days">Days</Table.Column>
                    <Table.Column id="status">Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                  <Table.Collection items={myLeaveRequests}>
                    {(req) => (
                      <Table.Row id={req.id}>
                        <Table.Cell>{req.leaveType}</Table.Cell>
                        <Table.Cell>
                          {formatDate(req.startDate)} – {formatDate(req.endDate)}
                        </Table.Cell>
                        <Table.Cell>{req.days}</Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={req.status} />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="payroll" className="pt-5">
          {myPayroll.length === 0 ? (
            <p className="rounded-lg border border-separator bg-surface px-4 py-10 text-center text-sm text-muted">No payroll records yet.</p>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Payroll">
                  <Table.Header>
                    <Table.Column isRowHeader id="month">Month</Table.Column>
                    <Table.Column id="netPay">Net pay</Table.Column>
                    <Table.Column id="status">Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                  <Table.Collection items={myPayroll}>
                    {(record) => (
                      <Table.Row id={record.id}>
                        <Table.Cell>{record.month}</Table.Cell>
                        <Table.Cell>{formatCurrency(record.netPay)}</Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={record.status} />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <EmployeeFormModal isOpen={editOpen} onOpenChange={setEditOpen} employee={employee} departments={departments ?? []} employees={employees ?? []} />

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={employee.employmentStatus === 'active' ? 'Deactivate employee?' : 'Activate employee?'}
        description={`${fullName(employee)} will be marked ${employee.employmentStatus === 'active' ? 'inactive' : 'active'}.`}
        confirmLabel={employee.employmentStatus === 'active' ? 'Deactivate' : 'Activate'}
        tone={employee.employmentStatus === 'active' ? 'danger' : 'primary'}
        isLoading={setStatusMutation.isPending}
        onConfirm={handleToggleStatus}
      />
    </div>
  )
}
