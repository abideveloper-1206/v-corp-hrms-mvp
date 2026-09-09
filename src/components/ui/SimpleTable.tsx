import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-separator bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">{children}</table>
      </div>
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('border-b border-separator bg-default/60 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-b border-separator last:border-0 hover:bg-default/40', className)}>{children}</tr>
}
