import { useQuery } from '@tanstack/react-query'
import * as db from '#/lib/db'

const isClient = typeof window !== 'undefined'

export const attendanceKeys = { all: ['attendance'] as const }

export function useAttendance() {
  return useQuery({ queryKey: attendanceKeys.all, queryFn: db.fetchAttendance, enabled: isClient })
}
