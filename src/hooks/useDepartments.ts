import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as db from '#/lib/db'
import { employeeKeys } from './useEmployees'

const isClient = typeof window !== 'undefined'

export const departmentKeys = { all: ['departments'] as const }

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: db.fetchDepartments,
    enabled: isClient,
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: db.createDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<db.DepartmentInput> }) => db.updateDepartment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useAssignEmployeeDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, departmentId }: { employeeId: string; departmentId: string }) =>
      db.assignEmployeeDepartment(employeeId, departmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
      qc.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
