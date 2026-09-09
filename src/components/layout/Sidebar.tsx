import { Link } from '@tanstack/react-router'
import { Boxes, ChevronLeft, ChevronRight } from 'lucide-react'
import { NAV_ITEMS } from './nav-config'
import { cn } from '#/lib/utils'

export function SidebarNav({
  collapsed = false,
  onNavigate,
  onToggleCollapsed,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  onToggleCollapsed?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className={cn('flex items-center gap-2.5 px-5 py-5', collapsed && 'justify-center px-3')}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Boxes className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-white">V Corp People</p>
            <p className="truncate text-[11px] font-medium text-white/45">HR Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
            activeProps={{
              className: cn(
                'relative flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-0',
              ),
            }}
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      {onToggleCollapsed ? (
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      ) : (
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] text-white/40">V Corp People &copy; 2026</p>
        </div>
      )}
    </div>
  )
}

export function DesktopSidebar({ collapsed, onToggleCollapsed }: { collapsed: boolean; onToggleCollapsed: () => void }) {
  return (
    <aside className={cn('sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block', collapsed ? 'w-[76px]' : 'w-64')}>
      <SidebarNav collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
    </aside>
  )
}
