import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Button, Skeleton, Switch, Tabs } from '@heroui/react'
import { LogOut } from 'lucide-react'
import { zodResolver } from '#/lib/zod-resolver'
import { PageHeader } from '#/components/ui/PageHeader'
import { ControlledTextField, FieldGroup, SelectField, TextInputField } from '#/components/ui/FormFields'
import { toast } from '#/components/ui/Toaster'
import { useAuth } from '#/context/AuthContext'
import {
  useAppearanceSettings,
  useNotificationSettings,
  useOrganizationSettings,
  useUpdateAppearanceSettings,
  useUpdateNotificationSettings,
  useUpdateOrganizationSettings,
} from '#/hooks/useSettings'
import type { AppearanceSettings, NotificationSettings, OrganizationSettings } from '#/types'

const searchSchema = z.object({ tab: z.string().optional() })

export const Route = createFileRoute('/_authed/settings')({ component: SettingsPage, validateSearch: searchSchema })

const TABS = [
  { id: 'organization', label: 'Organization' },
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
]

const TIMEZONE_OPTIONS = [
  { id: 'Asia/Kolkata (GMT+5:30)', label: 'Asia/Kolkata (GMT+5:30)' },
  { id: 'Asia/Dubai (GMT+4:00)', label: 'Asia/Dubai (GMT+4:00)' },
  { id: 'Europe/London (GMT+0:00)', label: 'Europe/London (GMT+0:00)' },
  { id: 'America/New_York (GMT-5:00)', label: 'America/New_York (GMT-5:00)' },
]

const WEEK_START_OPTIONS = [
  { id: 'Monday', label: 'Monday' },
  { id: 'Sunday', label: 'Sunday' },
]

function applyThemeToDom(theme: AppearanceSettings['theme']) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  document.documentElement.style.colorScheme = resolved
}

function SettingsPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const activeTab = TABS.some((t) => t.id === tab) ? (tab as string) : 'organization'

  return (
    <div>
      <PageHeader title="Settings" description="Manage your organization, profile, and workspace preferences." />

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => navigate({ search: { tab: key as string } })}>
        <Tabs.ListContainer className="border-b border-separator">
          <Tabs.List>
            {TABS.map((t) => (
              <Tabs.Tab key={t.id} id={t.id}>
                {t.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="organization" className="max-w-2xl pt-6">
          <OrganizationTab />
        </Tabs.Panel>
        <Tabs.Panel id="profile" className="max-w-2xl pt-6">
          <ProfileTab />
        </Tabs.Panel>
        <Tabs.Panel id="account" className="max-w-2xl pt-6">
          <AccountTab />
        </Tabs.Panel>
        <Tabs.Panel id="notifications" className="max-w-2xl pt-6">
          <NotificationsTab />
        </Tabs.Panel>
        <Tabs.Panel id="appearance" className="max-w-2xl pt-6">
          <AppearanceTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

const orgSchema = z.object({
  name: z.string().min(1, 'Required'),
  legalName: z.string().min(1, 'Required'),
  industry: z.string().min(1, 'Required'),
  website: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  timezone: z.string().min(1, 'Required'),
  workWeekStart: z.enum(['Sunday', 'Monday']),
})

function OrganizationTab() {
  const { data, isLoading } = useOrganizationSettings()
  const updateMutation = useUpdateOrganizationSettings()
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationSettings>({ resolver: zodResolver(orgSchema) })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  async function onSubmit(values: OrganizationSettings) {
    try {
      await updateMutation.mutateAsync(values)
      toast.success('Organization settings saved')
    } catch {
      toast.danger('Could not save organization settings.')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <ControlledTextField control={control} name="name" label="Organization name" errorMessage={errors.name?.message} />
        <ControlledTextField control={control} name="legalName" label="Legal name" errorMessage={errors.legalName?.message} />
        <ControlledTextField control={control} name="industry" label="Industry" errorMessage={errors.industry?.message} />
        <ControlledTextField control={control} name="website" label="Website" errorMessage={errors.website?.message} />
      </FieldGroup>
      <ControlledTextField control={control} name="address" label="Address" errorMessage={errors.address?.message} />
      <FieldGroup>
        <SelectField label="Timezone" items={TIMEZONE_OPTIONS} selectedKey={watch('timezone')} onSelectionChange={(k) => k && setValue('timezone', k)} />
        <SelectField
          label="Work week starts on"
          items={WEEK_START_OPTIONS}
          selectedKey={watch('workWeekStart')}
          onSelectionChange={(k) => k && setValue('workWeekStart', k as 'Sunday' | 'Monday')}
        />
      </FieldGroup>
      <div className="flex justify-end border-t border-separator pt-4">
        <Button type="submit" isDisabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

const profileSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Enter a valid email address'),
})

function ProfileTab() {
  const { user, updateProfile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string; email: string }>({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email })
  }, [user, reset])

  async function onSubmit(values: { name: string; email: string }) {
    if (!user) return
    setIsSaving(true)
    try {
      updateProfile({ name: values.name, email: values.email, avatarUrl: user.avatarUrl })
      toast.success('Profile updated')
    } catch {
      toast.danger('Could not update your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return <Skeleton className="h-40 w-full rounded-lg" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <ControlledTextField control={control} name="name" label="Full name" errorMessage={errors.name?.message} />
        <ControlledTextField control={control} name="email" type="email" label="Email" errorMessage={errors.email?.message} />
      </FieldGroup>
      <TextInputField label="Role" value={user.role} disabled readOnly onChange={() => {}} />
      <div className="flex justify-end border-t border-separator pt-4">
        <Button type="submit" isDisabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function AccountTab() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>({ resolver: zodResolver(passwordSchema) })

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success('Password updated')
    reset()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-sm font-semibold text-foreground">Change password</p>
        <TextInputField label="Current password" type="password" errorMessage={errors.currentPassword?.message} {...register('currentPassword')} />
        <FieldGroup>
          <TextInputField label="New password" type="password" errorMessage={errors.newPassword?.message} {...register('newPassword')} />
          <TextInputField label="Confirm new password" type="password" errorMessage={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </FieldGroup>
        <div className="flex justify-end border-t border-separator pt-4">
          <Button type="submit" isDisabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-danger/30 bg-danger-soft p-4">
        <p className="text-sm font-semibold text-danger-soft-foreground">Sign out</p>
        <p className="mt-1 text-sm text-danger-soft-foreground/80">Sign out of your V Corp People account on this device.</p>
        <Button
          className="mt-3"
          variant="danger"
          onPress={() => {
            logout()
            navigate({ to: '/login' })
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}

const NOTIFICATION_ITEMS: Array<{ key: keyof NotificationSettings; label: string; description: string }> = [
  { key: 'emailLeaveRequests', label: 'Leave requests', description: 'Get notified when employees submit leave requests.' },
  { key: 'emailPayrollUpdates', label: 'Payroll updates', description: 'Get notified when payroll status changes.' },
  { key: 'emailNewJoiners', label: 'New joiners', description: 'Get notified when a new employee is added.' },
  { key: 'productAnnouncements', label: 'Product announcements', description: 'Occasional updates about V Corp People features.' },
]

function NotificationsTab() {
  const { data, isLoading } = useNotificationSettings()
  const updateMutation = useUpdateNotificationSettings()

  async function handleToggle(key: keyof NotificationSettings, value: boolean) {
    if (!data) return
    try {
      await updateMutation.mutateAsync({ ...data, [key]: value })
      toast.success('Preference saved')
    } catch {
      toast.danger('Could not save preference.')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {NOTIFICATION_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-separator bg-surface p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted">{item.description}</p>
          </div>
          <Switch isSelected={data[item.key]} onChange={(checked) => handleToggle(item.key, checked)}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>
      ))}
    </div>
  )
}

const THEME_OPTIONS: Array<{ id: AppearanceSettings['theme']; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'auto', label: 'Auto' },
]

const DENSITY_OPTIONS: Array<{ id: AppearanceSettings['density']; label: string }> = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
]

function AppearanceTab() {
  const { data, isLoading } = useAppearanceSettings()
  const updateMutation = useUpdateAppearanceSettings()

  async function handleChange(next: AppearanceSettings) {
    try {
      await updateMutation.mutateAsync(next)
      applyThemeToDom(next.theme)
      toast.success('Appearance updated')
    } catch {
      toast.danger('Could not update appearance.')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleChange({ ...data, theme: opt.id })}
              className={`rounded-lg border p-4 text-sm font-medium transition ${
                data.theme === opt.id ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-separator bg-surface text-foreground hover:bg-default'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Density</p>
        <div className="grid grid-cols-2 gap-3">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleChange({ ...data, density: opt.id })}
              className={`rounded-lg border p-4 text-sm font-medium transition ${
                data.density === opt.id ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-separator bg-surface text-foreground hover:bg-default'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
