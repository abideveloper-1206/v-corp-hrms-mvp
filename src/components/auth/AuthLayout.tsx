import { Boxes } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-accent p-10 text-accent-foreground lg:flex">
        <div className="absolute inset-0 opacity-90 [background:radial-gradient(700px_400px_at_10%_0%,rgba(255,255,255,0.18),transparent),radial-gradient(700px_400px_at_100%_100%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Boxes className="size-5" />
          </div>
          <span className="text-lg font-bold">V Corp People</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-bold leading-tight">Run your whole workforce from one place.</p>
          <p className="mt-4 text-sm text-accent-foreground/80">
            Manage employees, departments, leave, attendance and payroll in a single modern HR workspace built for
            growing teams.
          </p>
        </div>
        <p className="relative text-xs text-accent-foreground/70">&copy; 2026 V Corp Technologies Pvt. Ltd.</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Boxes className="size-5" />
            </div>
            <span className="text-lg font-bold text-foreground">V Corp People</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
