import { Card } from '@heroui/react'
import type { Department, Employee } from '#/types'

export function DepartmentDistribution({ departments, employees }: { departments: Array<Department>; employees: Array<Employee> }) {
  const rows = departments
    .map((dept) => ({
      dept,
      count: employees.filter((e) => e.departmentId === dept.id).length,
    }))
    .sort((a, b) => b.count - a.count)

  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <Card>
      <Card.Header className="px-5 pt-5">
        <Card.Title>Department distribution</Card.Title>
        <Card.Description>Headcount across V Corp&apos;s departments</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-3.5 px-5 pb-5 pt-4">
        {rows.map(({ dept, count }) => (
          <div key={dept.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-foreground sm:w-32">{dept.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-default">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${Math.max(4, (count / max) * 100)}%`, backgroundColor: dept.color }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{count}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  )
}
