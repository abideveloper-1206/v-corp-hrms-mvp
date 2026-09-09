import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '#/lib/zod-resolver'
import { z } from 'zod'
import { useState } from 'react'
import { Alert, Button } from '@heroui/react'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { AuthLayout } from '#/components/auth/AuthLayout'
import { TextInputField } from '#/components/ui/FormFields'
import { requestPasswordReset, resetPassword } from '#/lib/auth'
import { toast } from '#/components/ui/Toaster'

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

const resetSchema = z
  .object({
    code: z.string().length(6, 'Enter the 6-digit code'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type EmailValues = z.infer<typeof emailSchema>
type ResetValues = z.infer<typeof resetSchema>

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage })

type Step = 'request' | 'reset' | 'done'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [mockCode, setMockCode] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const requestForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  async function onRequestSubmit(values: EmailValues) {
    const { found, code } = await requestPasswordReset(values.email)
    setEmail(values.email)
    if (found && code) {
      setMockCode(code)
      setStep('reset')
    } else {
      // Don't reveal whether the account exists — still advance so the flow can be demoed.
      setMockCode(null)
      setStep('reset')
    }
  }

  async function onResetSubmit(values: ResetValues) {
    setCodeError(null)
    if (mockCode && values.code !== mockCode) {
      setCodeError('That code doesn’t match. Please check and try again.')
      return
    }
    try {
      await resetPassword(email, values.newPassword)
      setStep('done')
      toast.success('Password reset successfully')
    } catch {
      toast.danger('Could not reset your password. Please try again.')
    }
  }

  return (
    <AuthLayout
      title={step === 'request' ? 'Reset your password' : step === 'reset' ? 'Enter your reset code' : 'Password reset'}
      description={
        step === 'request'
          ? "We'll send a one-time code to your work email."
          : step === 'reset'
            ? `Enter the code sent to ${email} and choose a new password.`
            : 'Your password has been updated.'
      }
    >
      {step === 'request' ? (
        <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate className="space-y-4">
          <TextInputField
            label="Work email"
            type="email"
            placeholder="you@vcorp.com"
            autoComplete="email"
            errorMessage={requestForm.formState.errors.email?.message}
            {...requestForm.register('email')}
          />
          <Button type="submit" fullWidth isDisabled={requestForm.formState.isSubmitting}>
            {requestForm.formState.isSubmitting ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      ) : step === 'reset' ? (
        <div className="space-y-4">
          {mockCode ? (
            <Alert status="accent">
              <Alert.Indicator>
                <KeyRound className="size-4" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>Demo mode</Alert.Title>
                <Alert.Description>
                  No email provider is connected for this assignment, so here is your one-time code:{' '}
                  <strong className="font-semibold text-foreground">{mockCode}</strong>
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} noValidate className="space-y-4">
            <TextInputField
              label="6-digit code"
              placeholder="123456"
              maxLength={6}
              errorMessage={resetForm.formState.errors.code?.message ?? codeError ?? undefined}
              {...resetForm.register('code')}
            />
            <TextInputField
              label="New password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              errorMessage={resetForm.formState.errors.newPassword?.message}
              {...resetForm.register('newPassword')}
            />
            <TextInputField
              label="Confirm new password"
              type="password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              errorMessage={resetForm.formState.errors.confirmPassword?.message}
              {...resetForm.register('confirmPassword')}
            />
            <Button type="submit" fullWidth isDisabled={resetForm.formState.isSubmitting}>
              {resetForm.formState.isSubmitting ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <Alert status="success">
            <Alert.Indicator>
              <CheckCircle2 className="size-4" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>All set</Alert.Title>
              <Alert.Description>Your password has been reset. You can now sign in with your new password.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button fullWidth onPress={() => navigate({ to: '/login' })}>
            Back to sign in
          </Button>
        </div>
      )}

      {step !== 'done' ? (
        <p className="mt-6 text-center text-sm text-muted">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  )
}
