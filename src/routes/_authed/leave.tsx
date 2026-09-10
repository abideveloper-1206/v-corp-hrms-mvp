import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Avatar, Button, Dropdown, Skeleton, Tabs, Table } from '@heroui/react'
import { CalendarClock, Check, Eye, MoreVertical, X } from 'lucide-react'
import { SearchBox } from '#/components/ui/SearchBox'
import { PaginationBar } from '#/components/ui/PaginationBar'
import { useDecideLeaveRequest, useLeaveBalances, useLeaveRequests } from '#/hooks/useLeave'
import { useEmployees } from '#/hooks/useEmployees'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { SelectField, type SelectOption } from '#/components/ui/FormFields'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { LeaveRequestDetailModal } from '#/components/leave/LeaveRequestDetailModal'
import { RejectReasonModal } from '#/components/leave/RejectReasonModal'
import { formatDate, fullName } from '#/lib/utils'
import { toast } from '#/components/ui/Toaster'
import type { LeaveRequest, LeaveType } from '#/types'

export const Route = createFileRoute('/_authed/leave')({ component: LeavePage })

const PAGE_SIZE = 8

const LEAVE_TYPES: Array<LeaveType> = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity/Paternity']

const TYPE_FILTERS: Array<SelectOption> = [{ id: 'all', label: 'All types' }, ...LEAVE_TYPES.map((t) => ({ id: t, label: t }))]
const STATUS_FILTERS: Array<SelectOption> = [
  { id: 'all', label: 'All statuses' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Rejected', label: 'Rejected' },
]

function LeavePage() {
  const { data: requests, isLoading, isError, refetch } = useLeaveRequests()
  const { data: balances, isLoading: balancesLoading } = useLeaveBalances()
  const { data: employees } = useEmployees()
  const decideMutation = useDecideLeaveRequest()

  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e])), [employees])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>('all')
  const [statusFilter, setStatusFilter] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null)
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null)

  const filtered = useMemo(() => {
    if (!requests) return []
    const term = search.trim().toLowerCase()
    return requests.filter((r) => {
      const emp = employeeMap.get(r.employeeId)
      const matchesTerm = !term || (emp && fullName(emp).toLowerCase().includes(term))
      const matchesType = !typeFilter || typeFilter === 'all' || r.leaveType === typeFilter
      const matchesStatus = !statusFilter || statusFilter === 'all' || r.status === statusFilter
      return matchesTerm && matchesType && matchesStatus
    })
  }, [requests, search, typeFilter, statusFilter, employeeMap])

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

  function resetFiltersAndPage(next: Partial<{ search: string; type: string | null; status: string | null }>) {
    if (next.search !== undefined) setSearch(next.search)
    if (next.type !== undefined) setTypeFilter(next.type)
    if (next.status !== undefined) setStatusFilter(next.status)
    setPage(1)
  }

  async function handleApprove() {
    if (!approveTarget) return
    try {
      await decideMutation.mutateAsync({ id: approveTarget.id, status: 'Approved' })
      toast.success('Leave request approved')
      setApproveTarget(null)
      setDetailRequest(null)
    } catch {
      toast.danger('Could not approve this request.')
    }
  }

  async function handleReject(note: string) {
    if (!rejectTarget) return
    try {
      await decideMutation.mutateAsync({ id: rejectTarget.id, status: 'Rejected', note })
      toast.success('Leave request rejected')
      setRejectTarget(null)
      setDetailRequest(null)
    } catch {
      toast.danger('Could not reject this request.')
    }
  }

  const balanceRows = useMemo(() => {
    if (!balances) return []
    const term = search.trim().toLowerCase()
    return balances
      .map((b) => {
        const emp = employeeMap.get(b.employeeId)
        return { ...b, employeeName: emp ? fullName(emp) : 'Unknown', matchesSearch: !term || (emp ? fullName(emp).toLowerCase().includes(term) : false) }
      })
      .filter((b) => b.matchesSearch)
  }, [balances, employeeMap, search])

  return (
    <div>
      <PageHeader title="Leave management" description="Review leave requests and track balances across V Corp." />

      <Tabs defaultSelectedKey="requests">
        <Tabs.ListContainer className="border-b border-separator">
          <Tabs.List>
            <Tabs.Tab id="requests">
              Requests
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="balances">
              Balances
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="requests" className="pt-5">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_180px]">
            <SearchBox value={search} onChange={(v) => resetFiltersAndPage({ search: v })} placeholder="Search by employee name…" />
            <SelectField label="Leave type" hideLabel items={TYPE_FILTERS} selectedKey={typeFilter} onSelectionChange={(k) => resetFiltersAndPage({ type: k })} />
            <SelectField label="Status" hideLabel items={STATUS_FILTERS} selectedKey={statusFilter} onSelectionChange={(k) => resetFiltersAndPage({ status: k })} />
          </div>

          {isError ? (
            <ErrorStateBlock message="We couldn't load leave requests. Please try again." onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyStateBlock
              icon={CalendarClock}
              title={requests && requests.length === 0 ? 'No leave requests have been submitted yet' : 'No requests match your current search/filter'}
              description={
                requests && requests.length === 0
                  ? 'Leave requests submitted by employees will show up here.'
                  : 'Try adjusting your search term or filters.'
              }
              action={
                requests && requests.length > 0 ? (
                  <Button variant="outline" onPress={() => resetFiltersAndPage({ search: '', type: 'all', status: 'all' })}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Leave Requests" className="min-w-[900px]">
                    <Table.Header>
                      <Table.Column isRowHeader id="employee">Employee</Table.Column>
                      <Table.Column id="type">Type</Table.Column>
                      <Table.Column id="dates">Dates</Table.Column>
                      <Table.Column id="days">Days</Table.Column>
                      <Table.Column id="status">Status</Table.Column>
                      <Table.Column id="actions"> </Table.Column>
                    </Table.Header>
                    <Table.Body>
                    <Table.Collection items={pageItems}>
                      {(request) => {
                        return (
                          <Table.Row id={request.id}>
                            <Table.Cell>
                          <button type="button" onClick={() => setDetailRequest(request)} className="flex items-center gap-3 text-left hover:opacity-80">
                            <Avatar size="sm">
                              <Avatar.Image src={request.employeeAvatarUrl} alt="" />
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">{request.employeeName}</span>
                              <span className="block truncate text-xs text-muted">{request.employeeDesignation}</span>
                            </span>
                          </button>
                        </Table.Cell>
                            <Table.Cell>
                          <span className="text-sm text-foreground">{request.leaveType}</span>
                        </Table.Cell>
                            <Table.Cell>
                          <span className="whitespace-nowrap text-sm text-muted">
                            {formatDate(request.startDate)} – {formatDate(request.endDate)}
                          </span>
                        </Table.Cell>
                            <Table.Cell>
                          <span className="text-sm text-muted">{request.days}</span>
                        </Table.Cell>
                            <Table.Cell>
                          <StatusBadge status={request.status} />
                        </Table.Cell>
                            <Table.Cell>
                          {request.status === 'Pending' ? (
                            <Dropdown>
                              <Dropdown.Trigger className="flex size-8 items-center justify-center rounded-lg text-muted outline-none hover:bg-default hover:text-foreground">
                                <MoreVertical className="size-4" />
                              </Dropdown.Trigger>
                              <Dropdown.Popover placement="bottom end" className="w-40">
                                <Dropdown.Menu
                                  onAction={(key) => {
                                    if (key === 'view') setDetailRequest(request)
                                    if (key === 'approve') setApproveTarget(request)
                                    if (key === 'reject') setRejectTarget(request)
                                  }}
                                >
                                  <Dropdown.Item id="view" textValue="View details">
                                    <Eye className="size-4" /> View details
                                  </Dropdown.Item>
                                  <Dropdown.Item id="approve" textValue="Approve">
                                    <Check className="size-4" /> Approve
                                  </Dropdown.Item>
                                  <Dropdown.Item id="reject" textValue="Reject" variant="danger">
                                    <X className="size-4" /> Reject
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          ) : (
                            <Button variant="ghost" size="sm" onPress={() => setDetailRequest(request)}>
                              View
                            </Button>
                          )}
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
        </Tabs.Panel>

        <Tabs.Panel id="balances" className="pt-5">
          {balancesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Leave Balances" className="min-w-[900px]">
                  <Table.Header>
                    <Table.Column isRowHeader id="employee">Employee</Table.Column>
                    <Table.Column id="leaveType">Leave type</Table.Column>
                    <Table.Column id="allocated">Allocated</Table.Column>
                    <Table.Column id="used">Used</Table.Column>
                    <Table.Column id="pending">Pending</Table.Column>
                    <Table.Column id="remaining">Remaining</Table.Column>
                  </Table.Header>
                  <Table.Body>
                  <Table.Collection items={balanceRows.slice(0, 100)}>
                    {(balance) => {
                      const remaining = balance.allocated - balance.used - balance.pending
                      return (
                        <Table.Row id={`${balance.employeeId}-${balance.leaveType}`}>
                        <Table.Cell>
                          <span className="text-sm text-foreground">{balance.employeeName}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-muted">{balance.leaveType}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-muted">{balance.allocated}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-muted">{balance.used}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-muted">{balance.pending}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm font-semibold text-foreground">{remaining}</span>
                        </Table.Cell>
                      </Table.Row>
                      )
                    }}
                  </Table.Collection>
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <LeaveRequestDetailModal
        isOpen={Boolean(detailRequest)}
        onOpenChange={(open) => !open && setDetailRequest(null)}
        request={detailRequest}
        employee={detailRequest ? employeeMap.get(detailRequest.employeeId) : undefined}
        onApprove={() => detailRequest && setApproveTarget(detailRequest)}
        onReject={() => detailRequest && setRejectTarget(detailRequest)}
      />

      <ConfirmDialog
        isOpen={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve leave request?"
        description={
          approveTarget ? (
            <>
              This will approve {employeeMap.get(approveTarget.employeeId) ? fullName(employeeMap.get(approveTarget.employeeId)!) : 'this employee'}
              &apos;s {approveTarget.leaveType} leave request for {approveTarget.days} day(s).
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Approve"
        tone="primary"
        isLoading={decideMutation.isPending}
        onConfirm={handleApprove}
      />

      <RejectReasonModal
        isOpen={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={handleReject}
        isLoading={decideMutation.isPending}
      />
    </div>
  )
}
