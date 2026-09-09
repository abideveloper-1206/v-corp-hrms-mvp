import { EmptyState, Button } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyStateBlock({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <EmptyState className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-default text-muted">
        <Icon className="size-6" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </EmptyState>
  )
}

export function ErrorStateBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState className="mx-auto max-w-md py-16 text-center">
      <p className="text-base font-semibold text-danger">Something went wrong</p>
      <p className="mt-1.5 text-sm text-muted">{message}</p>
      <div className="mt-5">
        <Button variant="outline" onPress={onRetry}>
          Try again
        </Button>
      </div>
    </EmptyState>
  )
}
