import { Card } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = 'accent',
  className,
}: {
  label: string
  value: string
  icon: LucideIcon
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const toneClasses: Record<string, string> = {
    accent: 'bg-accent-soft text-accent-soft-foreground',
    success: 'bg-success-soft text-success-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    danger: 'bg-danger-soft text-danger-soft-foreground',
  }

  return (
    <Card className={cn('animate-fade-in-up', className)}>
      <Card.Content className="flex flex-row items-center gap-3 p-3.5">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', toneClasses[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{label}</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
            <p className="whitespace-nowrap text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {trend ? (
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-semibold',
                  trend.direction === 'up' && 'text-success',
                  trend.direction === 'down' && 'text-danger',
                  trend.direction === 'flat' && 'text-muted',
                )}
              >
                {trend.label}
              </span>
            ) : null}
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}
