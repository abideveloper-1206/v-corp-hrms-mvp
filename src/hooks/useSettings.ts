import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as db from '#/lib/db'
import type { AppearanceSettings, NotificationSettings, OrganizationSettings } from '#/types'

const isClient = typeof window !== 'undefined'

export function useOrganizationSettings() {
  return useQuery({ queryKey: ['settings', 'org'], queryFn: db.fetchOrganizationSettings, enabled: isClient })
}

export function useUpdateOrganizationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: OrganizationSettings) => db.updateOrganizationSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'org'] }),
  })
}

export function useNotificationSettings() {
  return useQuery({ queryKey: ['settings', 'notifications'], queryFn: db.fetchNotificationSettings, enabled: isClient })
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NotificationSettings) => db.updateNotificationSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  })
}

export function useAppearanceSettings() {
  return useQuery({ queryKey: ['settings', 'appearance'], queryFn: db.fetchAppearanceSettings, enabled: isClient })
}

export function useUpdateAppearanceSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AppearanceSettings) => db.updateAppearanceSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'appearance'] }),
  })
}

export function useActivityLog() {
  return useQuery({ queryKey: ['activity'], queryFn: db.fetchActivityLog, enabled: isClient })
}
