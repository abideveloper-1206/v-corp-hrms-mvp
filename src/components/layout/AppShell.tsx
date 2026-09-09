import { useState, type ReactNode } from 'react'
import { DesktopSidebar } from './Sidebar'
import { MobileNavDrawer } from './MobileNavDrawer'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false)
  const [isCollapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar collapsed={isCollapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      <MobileNavDrawer isOpen={isMobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
