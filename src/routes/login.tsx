import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '#/lib/zod-resolver'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Alert, Button } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { AuthLayout } from '#/components/auth/AuthLayout'
import { TextInputField } from '#/components/ui/FormFields'
import { useAuth } from '#/context/AuthContext'
import { AuthError } from '#/lib/auth'
import { toast } from '#/components/ui/Toaster'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const { login, user, isInitializing } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: 'admin@vcorp.com', password: 'vcorp123' } })

  useEffect(() => {
    if (!isInitializing && user) navigate({ to: '/dashboard' })
  }, [isInitializing, user, navigate])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      toast.success('Welcome back!')
      navigate({ to: '/dashboard' })
    } catch (err) {
      setServerError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <AuthLayout title="Sign in to your workspace" description="Enter your credentials to access the HR dashboard.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError ? (
          <Alert status="danger">
            <Alert.Indicator>
              <TriangleAlert className="size-4" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Description>{serverError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <TextInputField
          label="Work email"
          type="email"
          placeholder="you@vcorp.com"
          autoComplete="email"
          errorMessage={errors.email?.message}
          {...register('email')}
        />
        <div>
          <TextInputField
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            errorMessage={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth isDisabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 rounded-lg bg-default px-3 py-2 text-xs text-muted">
        Demo credentials are pre-filled — <strong className="font-medium text-foreground">admin@vcorp.com</strong> /{' '}
        <strong className="font-medium text-foreground">vcorp123</strong>
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
