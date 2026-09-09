import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Skeleton } from '@heroui/react'
import { Pencil, Plus, Users2 } from 'lucide-react'
import { useDepartments } from '#/hooks/useDepartments'
import { useEmployees } from '#/hooks/useEmployees'
import { PageHeader } from '#/components/ui/PageHeader'
import { EmptyStateBlock, ErrorStateBlock } from '#/components/ui/EmptyStateBlock'
import { DepartmentFormModal } from '#/components/departments/DepartmentFormModal'
import { DepartmentEmployeesModal } from '#/components/departments/DepartmentEmployeesModal'
import { fullName } from '#/lib/utils'
import type { Department } from '#/types'

export const Route = createFileRoute('/_authed/departments')({ component: DepartmentsPage })

function DepartmentsPage() {
  const { data: departments, isLoading, isError, refetch } = useDepartments()
  const { data: employees } = useEmployees()

  const [formOpen, setFormOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [viewingDept, setViewingDept] = useState<Department | null>(null)

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organize V Corp's teams and manage department assignments."
        actions={
          <Button
            onPress={() => {
              setEditingDept(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" /> Add department
          </Button>
        }
      />

      {isError ? (
        <ErrorStateBlock message="We couldn't load departments. Please try again." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : !departments || departments.length === 0 ? (
        <EmptyStateBlock
          icon={Users2}
          title="No departments have been created yet"
          description="Add your first department to start organizing V Corp's workforce."
          action={
            <Button onPress={() => setFormOpen(true)}>
              <Plus className="size-4" /> Add department
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const head = employees?.find((e) => e.id === dept.headEmployeeId)
            const count = employees?.filter((e) => e.departmentId === dept.id).length ?? 0
            return (
              <Card key={dept.id} className="animate-fade-in-up flex flex-col">
                <Card.Content className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: dept.color }}>
                      <Users2 className="size-5" />
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDept(dept)
                        setFormOpen(true)
                      }}
                      aria-label={`Edit ${dept.name}`}
                      className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{dept.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{dept.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-separator pt-3">
                    <div className="text-xs text-muted">
                      <p>{head ? fullName(head) : 'Unassigned'}</p>
                      <p>Head of department</p>
                    </div>
                    <Button variant="outline" size="sm" onPress={() => setViewingDept(dept)}>
                      {count} {count === 1 ? 'employee' : 'employees'}
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )
          })}
        </div>
      )}

      <DepartmentFormModal
        isOpen={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingDept(null)
        }}
        department={editingDept}
        employees={employees ?? []}
      />

      <DepartmentEmployeesModal
        isOpen={Boolean(viewingDept)}
        onOpenChange={(open) => !open && setViewingDept(null)}
        department={viewingDept}
        employees={employees ?? []}
      />
    </div>
  )
}
