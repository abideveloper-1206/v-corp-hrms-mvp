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

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/signup')({ component: SignupPage })

function SignupPage() {
  const { signUp, user, isInitializing } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!isInitializing && user) navigate({ to: '/dashboard' })
  }, [isInitializing, user, navigate])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await signUp(values)
      toast.success('Account created. Welcome to V Corp People!')
      navigate({ to: '/dashboard' })
    } catch (err) {
      setServerError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <AuthLayout title="Create your HR workspace" description="Set up an admin account to start managing V Corp's workforce.">
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

        <TextInputField label="Full name" placeholder="Aarav Mehta" autoComplete="name" errorMessage={errors.name?.message} {...register('name')} />
        <TextInputField
          label="Work email"
          type="email"
          placeholder="you@vcorp.com"
          autoComplete="email"
          errorMessage={errors.email?.message}
          {...register('email')}
        />
        <TextInputField
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          errorMessage={errors.password?.message}
          {...register('password')}
        />
        <TextInputField
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          errorMessage={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth isDisabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
