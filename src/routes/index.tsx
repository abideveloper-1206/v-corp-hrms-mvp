import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Spinner } from '@heroui/react'
import { useAuth } from '#/context/AuthContext'

export const Route = createFileRoute('/')({ component: IndexPage })

function IndexPage() {
  const { user, isInitializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitializing) return
    navigate({ to: user ? '/dashboard' : '/login' })
  }, [isInitializing, user, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  )
}
