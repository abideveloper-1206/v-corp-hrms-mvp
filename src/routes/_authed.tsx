import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Spinner } from '@heroui/react'
import { useAuth } from '#/context/AuthContext'
import { AppShell } from '#/components/layout/AppShell'

export const Route = createFileRoute('/_authed')({ component: AuthedLayout })

function AuthedLayout() {
  const { user, isInitializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate({ to: '/login' })
    }
  }, [isInitializing, user, navigate])

  if (isInitializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
