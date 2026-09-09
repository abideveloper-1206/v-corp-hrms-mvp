import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Avatar, Dropdown, Header, Skeleton } from '@heroui/react'
import { Bell, LogOut, Menu as MenuIcon, Settings as SettingsIcon, User as UserIcon } from 'lucide-react'
import { useAuth } from '#/context/AuthContext'
import { useActivityLog } from '#/hooks/useSettings'
import { formatRelativeTime } from '#/lib/utils'
import { SearchBox } from '#/components/ui/SearchBox'

function userInitials(name: string | undefined) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || 'U'
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: activity } = useActivityLog()

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate({ to: '/employees', search: { q: search || undefined } })
  }

  function handleMenuAction(key: React.Key) {
    if (key === 'profile') navigate({ to: '/settings', search: { tab: 'profile' } })
    if (key === 'settings') navigate({ to: '/settings', search: { tab: undefined } })
    if (key === 'logout') {
      logout()
      navigate({ to: '/login' })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-separator bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <MenuIcon className="size-5" />
      </button>

      <form onSubmit={handleSearchSubmit} className="hidden flex-1 max-w-md sm:block">
        <SearchBox value={search} onChange={setSearch} placeholder="Search employees…" aria-label="Search employees" />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Dropdown>
          <Dropdown.Trigger className="relative flex size-9 items-center justify-center rounded-lg text-muted outline-none hover:bg-default hover:text-foreground data-[pressed]:bg-default">
            <Bell className="size-[18px]" />
            {activity && activity.length > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
            ) : null}
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="w-80">
            {!activity ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ) : activity.length === 0 ? (
              <Dropdown.Menu disabledKeys={['empty']}>
                <Dropdown.Section>
                  <Header className="px-3 py-2 text-xs font-semibold text-muted">Recent activity</Header>
                  <Dropdown.Item id="empty" textValue="No recent activity">
                    No recent activity yet.
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            ) : (
              <Dropdown.Menu>
                <Dropdown.Section>
                  <Header className="px-3 py-2 text-xs font-semibold text-muted">Recent activity</Header>
                  {activity.slice(0, 6).map((entry) => (
                    <Dropdown.Item key={entry.id} id={entry.id} textValue={entry.message} className="flex-col items-start gap-0.5">
                      <span className="text-sm text-foreground">{entry.message}</span>
                      <span className="text-xs text-muted">{formatRelativeTime(entry.timestamp)}</span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Section>
              </Dropdown.Menu>
            )}
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown>
          <Dropdown.Trigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 outline-none hover:bg-default data-[pressed]:bg-default">
            <Avatar size="sm">
              <Avatar.Image src={user?.avatarUrl} alt={user?.name ?? 'User'} />
              <Avatar.Fallback>{userInitials(user?.name)}</Avatar.Fallback>
            </Avatar>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-foreground">{user?.name ?? 'Loading…'}</span>
              <span className="block text-xs text-muted">{user?.role ?? ''}</span>
            </span>
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="w-56">
            <Dropdown.Menu onAction={handleMenuAction}>
              <Dropdown.Item id="profile" textValue="Profile">
                <UserIcon className="size-4" /> Profile
              </Dropdown.Item>
              <Dropdown.Item id="settings" textValue="Settings">
                <SettingsIcon className="size-4" /> Settings
              </Dropdown.Item>
              <Dropdown.Item id="logout" textValue="Log out" variant="danger">
                <LogOut className="size-4" /> Log out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  )
}
