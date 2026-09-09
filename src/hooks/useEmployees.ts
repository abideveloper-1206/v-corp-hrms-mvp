import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as db from '#/lib/db'
import type { Employee } from '#/types'

const isClient = typeof window !== 'undefined'

export const employeeKeys = {
  all: ['employees'] as const,
  detail: (id: string) => ['employees', id] as const,
}

export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.all,
    queryFn: db.fetchEmployees,
    enabled: isClient,
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ''),
    queryFn: () => db.fetchEmployee(id as string),
    enabled: isClient && Boolean(id),
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: db.createEmployee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<db.EmployeeInput> }) => db.updateEmployee(id, input),
    onSuccess: (updated: Employee) => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
      qc.invalidateQueries({ queryKey: employeeKeys.detail(updated.id) })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useSetEmployeeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Employee['employmentStatus'] }) => db.setEmployeeStatus(id, status),
    onSuccess: (updated: Employee) => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
      qc.invalidateQueries({ queryKey: employeeKeys.detail(updated.id) })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
