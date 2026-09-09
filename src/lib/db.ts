import type {
  ActivityLogEntry,
  AppearanceSettings,
  AttendanceRecord,
  AuthUser,
  Department,
  Employee,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  NotificationSettings,
  OrganizationSettings,
  PayrollRecord,
  PayrollStatus,
} from '#/types'
import { readStorage, simulateLatency, writeStorage } from './storage'
import {
  buildActivityLog,
  buildAttendance,
  buildDemoUser,
  buildDepartments,
  buildEmployees,
  buildLeaveRequestsAndBalances,
  buildPayroll,
  defaultAppearanceSettings,
  defaultNotificationSettings,
  defaultOrganizationSettings,
} from './seed'

const KEYS = {
  seeded: 'seeded-v2',
  employees: 'employees',
  departments: 'departments',
  leaveRequests: 'leave-requests',
  leaveBalances: 'leave-balances',
  attendance: 'attendance',
  payroll: 'payroll',
  activity: 'activity-log',
  users: 'users',
  org: 'settings-org',
  notifications: 'settings-notifications',
  appearance: 'settings-appearance',
} as const

function ensureSeeded() {
  if (readStorage(KEYS.seeded, false)) return

  const departments = buildDepartments()
  const employees = buildEmployees(departments)
  const { requests, balances } = buildLeaveRequestsAndBalances(employees)
  const attendance = buildAttendance(employees)
  const payroll = buildPayroll(employees)
  const activity = buildActivityLog(employees, departments)
  const demoUser = buildDemoUser()

  writeStorage(KEYS.departments, departments)
  writeStorage(KEYS.employees, employees)
  writeStorage(KEYS.leaveRequests, requests)
  writeStorage(KEYS.leaveBalances, balances)
  writeStorage(KEYS.attendance, attendance)
  writeStorage(KEYS.payroll, payroll)
  writeStorage(KEYS.activity, activity)
  writeStorage(KEYS.users, [demoUser])
  writeStorage(KEYS.org, defaultOrganizationSettings())
  writeStorage(KEYS.notifications, defaultNotificationSettings())
  writeStorage(KEYS.appearance, defaultAppearanceSettings())
  writeStorage(KEYS.seeded, true)
}

function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) {
  const log = readStorage<Array<ActivityLogEntry>>(KEYS.activity, [])
  const next: ActivityLogEntry = {
    ...entry,
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
  writeStorage(KEYS.activity, [next, ...log].slice(0, 50))
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

// ---------- Employees ----------

export async function fetchEmployees(): Promise<Array<Employee>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<Employee>>(KEYS.employees, [])
}

export async function fetchEmployee(id: string): Promise<Employee | null> {
  ensureSeeded()
  await simulateLatency()
  const employees = readStorage<Array<Employee>>(KEYS.employees, [])
  return employees.find((e) => e.id === id) ?? null
}

export type EmployeeInput = Omit<Employee, 'id' | 'employeeCode' | 'avatarUrl'>

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  ensureSeeded()
  await simulateLatency(300, 650)
  const employees = readStorage<Array<Employee>>(KEYS.employees, [])
  const id = genId('EMP')
  const employee: Employee = {
    ...input,
    id,
    employeeCode: id,
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
  }
  writeStorage(KEYS.employees, [employee, ...employees])
  logActivity({ message: `${employee.firstName} ${employee.lastName} was added as a new employee.`, actor: 'You', type: 'employee' })
  return employee
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<Employee> {
  ensureSeeded()
  await simulateLatency(300, 650)
  const employees = readStorage<Array<Employee>>(KEYS.employees, [])
  const idx = employees.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Employee not found')
  const updated = { ...employees[idx], ...input }
  employees[idx] = updated
  writeStorage(KEYS.employees, employees)
  logActivity({ message: `${updated.firstName} ${updated.lastName}'s profile was updated.`, actor: 'You', type: 'employee' })
  return updated
}

export async function setEmployeeStatus(id: string, status: Employee['employmentStatus']): Promise<Employee> {
  ensureSeeded()
  await simulateLatency(200, 400)
  const employees = readStorage<Array<Employee>>(KEYS.employees, [])
  const idx = employees.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Employee not found')
  employees[idx] = { ...employees[idx], employmentStatus: status }
  writeStorage(KEYS.employees, employees)
  logActivity({
    message: `${employees[idx].firstName} ${employees[idx].lastName} was marked ${status === 'active' ? 'active' : 'inactive'}.`,
    actor: 'You',
    type: 'employee',
  })
  return employees[idx]
}

// ---------- Departments ----------

export async function fetchDepartments(): Promise<Array<Department>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<Department>>(KEYS.departments, [])
}

export type DepartmentInput = Omit<Department, 'id' | 'createdAt'>

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  ensureSeeded()
  await simulateLatency(300, 600)
  const departments = readStorage<Array<Department>>(KEYS.departments, [])
  const department: Department = { ...input, id: genId('DEPT'), createdAt: new Date().toISOString() }
  writeStorage(KEYS.departments, [department, ...departments])
  logActivity({ message: `${department.name} department was created.`, actor: 'You', type: 'department' })
  return department
}

export async function updateDepartment(id: string, input: Partial<DepartmentInput>): Promise<Department> {
  ensureSeeded()
  await simulateLatency(300, 600)
  const departments = readStorage<Array<Department>>(KEYS.departments, [])
  const idx = departments.findIndex((d) => d.id === id)
  if (idx === -1) throw new Error('Department not found')
  departments[idx] = { ...departments[idx], ...input }
  writeStorage(KEYS.departments, departments)
  logActivity({ message: `${departments[idx].name} department was updated.`, actor: 'You', type: 'department' })
  return departments[idx]
}

export async function assignEmployeeDepartment(employeeId: string, departmentId: string): Promise<Employee> {
  return updateEmployee(employeeId, { departmentId })
}

// ---------- Leave ----------

export async function fetchLeaveRequests(): Promise<Array<LeaveRequest>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<LeaveRequest>>(KEYS.leaveRequests, [])
}

export async function fetchLeaveBalances(): Promise<Array<LeaveBalance>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<LeaveBalance>>(KEYS.leaveBalances, [])
}

export async function decideLeaveRequest(id: string, status: Extract<LeaveStatus, 'Approved' | 'Rejected'>, note?: string): Promise<LeaveRequest> {
  ensureSeeded()
  await simulateLatency(300, 550)
  const requests = readStorage<Array<LeaveRequest>>(KEYS.leaveRequests, [])
  const idx = requests.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Leave request not found')
  const request = { ...requests[idx], status, decidedOn: new Date().toISOString(), decisionNote: note ?? (status === 'Approved' ? 'Approved as requested.' : 'Rejected.') }
  requests[idx] = request
  writeStorage(KEYS.leaveRequests, requests)

  if (status === 'Approved') {
    const balances = readStorage<Array<LeaveBalance>>(KEYS.leaveBalances, [])
    const bIdx = balances.findIndex((b) => b.employeeId === request.employeeId && b.leaveType === request.leaveType)
    if (bIdx !== -1) {
      balances[bIdx] = { ...balances[bIdx], used: balances[bIdx].used + request.days, pending: Math.max(0, balances[bIdx].pending - request.days) }
      writeStorage(KEYS.leaveBalances, balances)
    }
  } else {
    const balances = readStorage<Array<LeaveBalance>>(KEYS.leaveBalances, [])
    const bIdx = balances.findIndex((b) => b.employeeId === request.employeeId && b.leaveType === request.leaveType)
    if (bIdx !== -1) {
      balances[bIdx] = { ...balances[bIdx], pending: Math.max(0, balances[bIdx].pending - request.days) }
      writeStorage(KEYS.leaveBalances, balances)
    }
  }

  const employees = readStorage<Array<Employee>>(KEYS.employees, [])
  const emp = employees.find((e) => e.id === request.employeeId)
  logActivity({
    message: `${emp ? `${emp.firstName} ${emp.lastName}` : 'An employee'}'s ${request.leaveType} leave request was ${status.toLowerCase()}.`,
    actor: 'You',
    type: 'leave',
  })

  return request
}

export async function createLeaveRequest(input: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status' | 'decidedOn' | 'decisionNote'>): Promise<LeaveRequest> {
  ensureSeeded()
  await simulateLatency(300, 600)
  const requests = readStorage<Array<LeaveRequest>>(KEYS.leaveRequests, [])
  const request: LeaveRequest = { ...input, id: genId('LR'), appliedOn: new Date().toISOString(), status: 'Pending', decidedOn: null, decisionNote: null }
  writeStorage(KEYS.leaveRequests, [request, ...requests])

  const balances = readStorage<Array<LeaveBalance>>(KEYS.leaveBalances, [])
  const bIdx = balances.findIndex((b) => b.employeeId === request.employeeId && b.leaveType === request.leaveType)
  if (bIdx !== -1) {
    balances[bIdx] = { ...balances[bIdx], pending: balances[bIdx].pending + request.days }
    writeStorage(KEYS.leaveBalances, balances)
  }

  logActivity({ message: `A new ${request.leaveType} leave request was submitted.`, actor: 'You', type: 'leave' })
  return request
}

// ---------- Attendance ----------

export async function fetchAttendance(): Promise<Array<AttendanceRecord>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<AttendanceRecord>>(KEYS.attendance, [])
}

// ---------- Payroll ----------

export async function fetchPayroll(): Promise<Array<PayrollRecord>> {
  ensureSeeded()
  await simulateLatency()
  return readStorage<Array<PayrollRecord>>(KEYS.payroll, [])
}

export async function updatePayrollStatus(id: string, status: PayrollStatus): Promise<PayrollRecord> {
  ensureSeeded()
  await simulateLatency(300, 550)
  const records = readStorage<Array<PayrollRecord>>(KEYS.payroll, [])
  const idx = records.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Payroll record not found')
  records[idx] = { ...records[idx], status, processedOn: status === 'Completed' ? new Date().toISOString() : records[idx].processedOn }
  writeStorage(KEYS.payroll, records)
  logActivity({ message: `A payroll record moved to ${status}.`, actor: 'You', type: 'payroll' })
  return records[idx]
}

// ---------- Activity ----------

export async function fetchActivityLog(): Promise<Array<ActivityLogEntry>> {
  ensureSeeded()
  await simulateLatency(150, 300)
  return readStorage<Array<ActivityLogEntry>>(KEYS.activity, [])
}

// ---------- Settings ----------

export async function fetchOrganizationSettings(): Promise<OrganizationSettings> {
  ensureSeeded()
  await simulateLatency(150, 300)
  return readStorage<OrganizationSettings>(KEYS.org, defaultOrganizationSettings())
}

export async function updateOrganizationSettings(input: OrganizationSettings): Promise<OrganizationSettings> {
  ensureSeeded()
  await simulateLatency(300, 500)
  writeStorage(KEYS.org, input)
  logActivity({ message: 'Organization settings were updated.', actor: 'You', type: 'department' })
  return input
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  ensureSeeded()
  await simulateLatency(150, 300)
  return readStorage<NotificationSettings>(KEYS.notifications, defaultNotificationSettings())
}

export async function updateNotificationSettings(input: NotificationSettings): Promise<NotificationSettings> {
  ensureSeeded()
  await simulateLatency(250, 450)
  writeStorage(KEYS.notifications, input)
  return input
}

export async function fetchAppearanceSettings(): Promise<AppearanceSettings> {
  ensureSeeded()
  await simulateLatency(100, 200)
  return readStorage<AppearanceSettings>(KEYS.appearance, defaultAppearanceSettings())
}

export async function updateAppearanceSettings(input: AppearanceSettings): Promise<AppearanceSettings> {
  ensureSeeded()
  await simulateLatency(150, 300)
  writeStorage(KEYS.appearance, input)
  return input
}

// ---------- Users (auth-adjacent lookups) ----------

export function getUsersSync(): Array<AuthUser> {
  ensureSeeded()
  return readStorage<Array<AuthUser>>(KEYS.users, [])
}

export function saveUsersSync(users: Array<AuthUser>) {
  writeStorage(KEYS.users, users)
}

export { ensureSeeded }
