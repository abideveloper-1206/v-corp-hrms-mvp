import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as db from '#/lib/db'
import type { PayrollStatus } from '#/types'

const isClient = typeof window !== 'undefined'

export const payrollKeys = { all: ['payroll'] as const }

export function usePayroll() {
  return useQuery({ queryKey: payrollKeys.all, queryFn: db.fetchPayroll, enabled: isClient })
}

export function useUpdatePayrollStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PayrollStatus }) => db.updatePayrollStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
