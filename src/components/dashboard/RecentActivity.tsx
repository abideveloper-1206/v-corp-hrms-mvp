import { Card, Skeleton } from '@heroui/react'
import { CalendarClock, ClipboardCheck, LogIn, UserPlus, Wallet, Building2 } from 'lucide-react'
import type { ActivityLogEntry } from '#/types'
import { formatRelativeTime } from '#/lib/utils'

const ICONS: Record<ActivityLogEntry['type'], typeof UserPlus> = {
  employee: UserPlus,
  leave: CalendarClock,
  department: Building2,
  payroll: Wallet,
  attendance: ClipboardCheck,
  auth: LogIn,
}

export function RecentActivity({ activity, isLoading }: { activity: Array<ActivityLogEntry> | undefined; isLoading: boolean }) {
  return (
    <Card>
      <Card.Header className="px-5 pt-5">
        <Card.Title>Recent activity</Card.Title>
        <Card.Description>Latest changes across the organization</Card.Description>
      </Card.Header>
      <Card.Content className="px-5 pb-5 pt-2">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !activity || activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No activity yet. Actions you take will show up here.</p>
        ) : (
          <ul className="divide-y divide-separator">
            {activity.slice(0, 8).map((entry) => {
              const Icon = ICONS[entry.type]
              return (
                <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{entry.message}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card.Content>
    </Card>
  )
}
