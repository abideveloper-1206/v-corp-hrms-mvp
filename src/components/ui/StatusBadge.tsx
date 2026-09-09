import { Chip } from '@heroui/react'
import type { ChipProps } from '@heroui/react'

type Color = 'success' | 'warning' | 'danger' | 'default' | 'accent'

const COLOR_MAP: Record<string, Color> = {
  active: 'success',
  Present: 'success',
  Approved: 'success',
  Completed: 'success',
  'on-leave': 'warning',
  'On Leave': 'warning',
  Pending: 'warning',
  Processing: 'warning',
  Late: 'warning',
  'Half Day': 'warning',
  inactive: 'default',
  Weekend: 'default',
  Draft: 'default',
  Rejected: 'danger',
  Absent: 'danger',
}

const LABEL_MAP: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  'on-leave': 'On Leave',
}

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: ChipProps['size'] }) {
  const color = COLOR_MAP[status] ?? 'default'

  return (
    <Chip size={size} color={color} variant="soft">
      <Chip.Label>{LABEL_MAP[status] ?? status}</Chip.Label>
    </Chip>
  )
}
