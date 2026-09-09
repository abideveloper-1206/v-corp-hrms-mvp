import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as db from '#/lib/db'
import type { LeaveStatus } from '#/types'

const isClient = typeof window !== 'undefined'

export const leaveKeys = {
  requests: ['leave-requests'] as const,
  balances: ['leave-balances'] as const,
}

export function useLeaveRequests() {
  return useQuery({ queryKey: leaveKeys.requests, queryFn: db.fetchLeaveRequests, enabled: isClient })
}

export function useLeaveBalances() {
  return useQuery({ queryKey: leaveKeys.balances, queryFn: db.fetchLeaveBalances, enabled: isClient })
}

export function useDecideLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: Extract<LeaveStatus, 'Approved' | 'Rejected'>; note?: string }) =>
      db.decideLeaveRequest(id, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.requests })
      qc.invalidateQueries({ queryKey: leaveKeys.balances })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: db.createLeaveRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.requests })
      qc.invalidateQueries({ queryKey: leaveKeys.balances })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
