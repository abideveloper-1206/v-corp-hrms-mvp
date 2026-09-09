import { useMemo, useState } from 'react'
import { Avatar, Button } from '@heroui/react'
import { UserPlus } from 'lucide-react'
import type { Department, Employee } from '#/types'
import { FormModal } from '#/components/ui/FormModal'
import { SelectField } from '#/components/ui/FormFields'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { useAssignEmployeeDepartment } from '#/hooks/useDepartments'
import { toast } from '#/components/ui/Toaster'
import { fullName } from '#/lib/utils'

export function DepartmentEmployeesModal({
  isOpen,
  onOpenChange,
  department,
  employees,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  employees: Array<Employee>
}) {
  const assignMutation = useAssignEmployeeDepartment()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const deptEmployees = useMemo(() => (department ? employees.filter((e) => e.departmentId === department.id) : []), [employees, department])
  const otherEmployees = useMemo(() => (department ? employees.filter((e) => e.departmentId !== department.id) : []), [employees, department])
  const otherOptions = useMemo(() => otherEmployees.map((e) => ({ id: e.id, label: `${fullName(e)} (${e.designation})` })), [otherEmployees])

  async function handleAssign() {
    if (!department || !selectedEmployeeId) return
    try {
      await assignMutation.mutateAsync({ employeeId: selectedEmployeeId, departmentId: department.id })
      toast.success('Employee assigned', { description: `Added to ${department.name}.` })
      setSelectedEmployeeId(null)
    } catch {
      toast.danger('Could not assign employee.')
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setSelectedEmployeeId(null)
      }}
      title={department?.name ?? 'Department'}
      description={`${deptEmployees.length} employee${deptEmployees.length === 1 ? '' : 's'} in this department`}
      size="lg"
    >
      <div className="mb-5 flex flex-col gap-2 rounded-lg bg-default p-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SelectField
            label="Add employee to this department"
            items={otherOptions}
            selectedKey={selectedEmployeeId}
            onSelectionChange={setSelectedEmployeeId}
            placeholder={otherOptions.length === 0 ? 'All employees already assigned' : 'Select an employee'}
            isDisabled={otherOptions.length === 0}
          />
        </div>
        <Button onPress={handleAssign} isDisabled={!selectedEmployeeId || assignMutation.isPending}>
          <UserPlus className="size-4" /> {assignMutation.isPending ? 'Adding…' : 'Add'}
        </Button>
      </div>

      {deptEmployees.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No employees in this department yet.</p>
      ) : (
        <ul className="divide-y divide-separator">
          {deptEmployees.map((employee) => (
            <li key={employee.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  <Avatar.Image src={employee.avatarUrl} alt="" />
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{fullName(employee)}</p>
                  <p className="truncate text-xs text-muted">{employee.designation}</p>
                </div>
              </div>
              <StatusBadge status={employee.employmentStatus} />
            </li>
          ))}
        </ul>
      )}
    </FormModal>
  )
}
