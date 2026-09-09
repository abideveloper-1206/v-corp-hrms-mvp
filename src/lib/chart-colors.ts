export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  Present: 'var(--viz-good)',
  Late: 'var(--viz-warning)',
  'Half Day': 'var(--viz-serious)',
  Absent: 'var(--viz-critical)',
  'On Leave': 'var(--viz-violet)',
  Weekend: 'var(--viz-neutral)',
}

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  Approved: 'var(--viz-good)',
  Pending: 'var(--viz-warning)',
  Rejected: 'var(--viz-critical)',
}

export const PAYROLL_STATUS_COLOR: Record<string, string> = {
  Completed: 'var(--viz-good)',
  Processing: 'var(--viz-warning)',
  Draft: 'var(--viz-neutral)',
}
