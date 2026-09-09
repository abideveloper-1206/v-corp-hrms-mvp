import type { LucideIcon } from 'lucide-react'
import { Building2, CalendarClock, LayoutDashboard, Settings, Users, Wallet, Clock3 } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const NAV_ITEMS: Array<NavItem> = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users },
  { label: 'Departments', to: '/departments', icon: Building2 },
  { label: 'Leave', to: '/leave', icon: CalendarClock },
  { label: 'Attendance', to: '/attendance', icon: Clock3 },
  { label: 'Payroll', to: '/payroll', icon: Wallet },
  { label: 'Settings', to: '/settings', icon: Settings },
]
