import { createFileRoute } from '@tanstack/react-router'
import { Skeleton } from '@heroui/react'
import { Building2, CalendarClock, UserCheck, UserPlus, Users } from 'lucide-react'
import { useEmployees } from '#/hooks/useEmployees'
import { useDepartments } from '#/hooks/useDepartments'
import { useAttendance } from '#/hooks/useAttendance'
import { usePayroll } from '#/hooks/usePayroll'
import { useActivityLog } from '#/hooks/useSettings'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatCard } from '#/components/ui/StatCard'
import { DepartmentDistribution } from '#/components/dashboard/DepartmentDistribution'
import { AttendanceSummary } from '#/components/dashboard/AttendanceSummary'
import { PayrollSummary } from '#/components/dashboard/PayrollSummary'
import { RecentActivity } from '#/components/dashboard/RecentActivity'
import { useAuth } from '#/context/AuthContext'

const TODAY = '2026-09-08'
const CURRENT_MONTH = '2026-09'

export const Route = createFileRoute('/_authed/dashboard')({ component: DashboardPage })

function DashboardPage() {
  const { user } = useAuth()
  const { data: employees, isLoading: employeesLoading } = useEmployees()
  const { data: departments, isLoading: departmentsLoading } = useDepartments()
  const { data: attendance, isLoading: attendanceLoading } = useAttendance()
  const { data: payroll, isLoading: payrollLoading } = usePayroll()
  const { data: activity, isLoading: activityLoading } = useActivityLog()

  const isLoading = employeesLoading || departmentsLoading

  const totalEmployees = employees?.length ?? 0
  const activeEmployees = employees?.filter((e) => e.employmentStatus === 'active').length ?? 0
  const onLeaveEmployees = employees?.filter((e) => e.employmentStatus === 'on-leave').length ?? 0
  const newJoiners =
    employees?.filter((e) => {
      const joined = new Date(e.joiningDate)
      const cutoff = new Date(TODAY)
      cutoff.setDate(cutoff.getDate() - 30)
      return joined >= cutoff
    }).length ?? 0

  const todayRecords = attendance?.filter((r) => r.date === TODAY) ?? []
  const monthRecords = payroll?.filter((r) => r.month === CURRENT_MONTH) ?? []

  return (
    <div>
      <PageHeader
        title={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's what's happening across V Corp today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[66px] rounded-lg" />)
        ) : (
          <>
            <StatCard label="Total employees" value={String(totalEmployees)} icon={Users} tone="accent" />
            <StatCard label="Active employees" value={String(activeEmployees)} icon={UserCheck} tone="success" />
            <StatCard label="New joiners (30d)" value={String(newJoiners)} icon={UserPlus} tone="warning" />
            <StatCard label="On leave today" value={String(onLeaveEmployees)} icon={CalendarClock} tone="danger" />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading ? <Skeleton className="h-72 rounded-lg" /> : <DepartmentDistribution departments={departments ?? []} employees={employees ?? []} />}
        {attendanceLoading ? <Skeleton className="h-72 rounded-lg" /> : <AttendanceSummary todayRecords={todayRecords} />}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {payrollLoading ? <Skeleton className="h-72 rounded-lg" /> : <PayrollSummary monthRecords={monthRecords} month={CURRENT_MONTH} />}
        <RecentActivity activity={activity} isLoading={activityLoading} />
      </div>

      {!isLoading && totalEmployees === 0 ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-separator px-4 py-3 text-sm text-muted">
          <Building2 className="size-4" /> No employees yet. Head to the Employees page to add your first hire.
        </div>
      ) : null}
    </div>
  )
}
