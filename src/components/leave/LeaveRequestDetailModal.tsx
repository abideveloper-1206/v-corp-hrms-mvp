import { Avatar, Button } from '@heroui/react'
import { Check, X } from 'lucide-react'
import type { Employee, LeaveRequest } from '#/types'
import { FormModal } from '#/components/ui/FormModal'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { formatDate, formatDateTime, fullName } from '#/lib/utils'

export function LeaveRequestDetailModal({
  isOpen,
  onOpenChange,
  request,
  employee,
  onApprove,
  onReject,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  request: LeaveRequest | null
  employee: Employee | undefined
  onApprove: () => void
  onReject: () => void
}) {
  if (!request) return null

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Leave request details"
      size="sm"
      footer={
        request.status === 'Pending' ? (
          <div className="flex justify-end gap-2">
            <Button variant="danger-soft" onPress={onReject}>
              <X className="size-4" /> Reject
            </Button>
            <Button onPress={onApprove}>
              <Check className="size-4" /> Approve
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3">
        <Avatar size="md">
          <Avatar.Image src={employee?.avatarUrl} alt="" />
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{employee ? fullName(employee) : 'Unknown employee'}</p>
          <p className="text-xs text-muted">{employee?.designation}</p>
        </div>
        <span className="ml-auto">
          <StatusBadge status={request.status} />
        </span>
      </div>

      <dl className="mt-5 space-y-3 border-t border-separator pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Leave type</dt>
          <dd className="font-medium text-foreground">{request.leaveType}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Dates</dt>
          <dd className="font-medium text-foreground">
            {formatDate(request.startDate)} – {formatDate(request.endDate)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Duration</dt>
          <dd className="font-medium text-foreground">{request.days} day(s)</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Applied on</dt>
          <dd className="font-medium text-foreground">{formatDateTime(request.appliedOn)}</dd>
        </div>
        <div>
          <dt className="text-muted">Reason</dt>
          <dd className="mt-1 rounded-lg bg-default p-2.5 text-foreground">{request.reason}</dd>
        </div>
        {request.decisionNote ? (
          <div>
            <dt className="text-muted">Decision note</dt>
            <dd className="mt-1 rounded-lg bg-default p-2.5 text-foreground">{request.decisionNote}</dd>
            <p className="mt-1 text-xs text-muted">Decided {formatDateTime(request.decidedOn)}</p>
          </div>
        ) : null}
      </dl>
    </FormModal>
  )
}
