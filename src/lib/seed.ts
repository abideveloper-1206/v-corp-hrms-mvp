import { faker } from '@faker-js/faker'
import type {
  ActivityLogEntry,
  AppearanceSettings,
  AttendanceRecord,
  AttendanceStatus,
  AuthUser,
  Department,
  Employee,
  EmploymentStatus,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  NotificationSettings,
  OrganizationSettings,
  PayrollRecord,
  PayrollStatus,
} from '#/types'

faker.seed(2024)

// Colors follow a validated categorical palette (fixed order, CVD-safe adjacent pairs).
const DEPARTMENT_DEFS: Array<{ name: string; description: string; color: string }> = [
  { name: 'Engineering', description: 'Builds and maintains V Corp product and platform.', color: '#2a78d6' },
  { name: 'Product', description: 'Owns product strategy, discovery, and roadmap.', color: '#eb6834' },
  { name: 'Design', description: 'Crafts product experience, UX research and visual design.', color: '#1baf7a' },
  { name: 'Sales', description: 'Drives new business and revenue growth.', color: '#eda100' },
  { name: 'Marketing', description: 'Owns brand, demand generation and communications.', color: '#e87ba4' },
  { name: 'People & HR', description: 'Manages hiring, culture, and employee experience.', color: '#008300' },
  { name: 'Finance', description: 'Oversees budgeting, payroll and financial planning.', color: '#4a3aa7' },
  { name: 'Customer Success', description: 'Supports customers and drives retention.', color: '#e34948' },
]

const DESIGNATIONS_BY_DEPT: Record<string, Array<string>> = {
  Engineering: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'],
  Product: ['Product Manager', 'Senior Product Manager', 'Product Analyst', 'Head of Product'],
  Design: ['Product Designer', 'Senior Product Designer', 'UX Researcher', 'Design Lead'],
  Sales: ['Sales Executive', 'Account Executive', 'Sales Manager', 'VP of Sales'],
  Marketing: ['Marketing Executive', 'Content Strategist', 'Growth Marketer', 'Marketing Manager'],
  'People & HR': ['HR Executive', 'HR Business Partner', 'Talent Acquisition Specialist', 'Head of People'],
  Finance: ['Finance Analyst', 'Accountant', 'Finance Manager', 'Controller'],
  'Customer Success': ['Customer Success Manager', 'Support Specialist', 'CS Team Lead'],
}

const LOCATIONS = ['Chennai, IN', 'Bengaluru, IN', 'Remote', 'Mumbai, IN', 'Hyderabad, IN', 'Pune, IN']

function toId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** Formats a Date as a local YYYY-MM-DD calendar-date key (avoids UTC shift from toISOString()). */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function buildDepartments(): Array<Department> {
  return DEPARTMENT_DEFS.map((d, i) => ({
    id: toId('DEPT', i + 1),
    name: d.name,
    description: d.description,
    headEmployeeId: null,
    color: d.color,
    createdAt: faker.date.past({ years: 3 }).toISOString(),
  }))
}

export function buildEmployees(departments: Array<Department>): Array<Employee> {
  const employees: Array<Employee> = []
  const totalEmployees = 62
  const managersByDept: Record<string, Array<string>> = {}

  for (let i = 0; i < totalEmployees; i++) {
    const dept = faker.helpers.arrayElement(departments)
    const designations = DESIGNATIONS_BY_DEPT[dept.name] ?? ['Associate']
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const id = toId('EMP', i + 1)
    const status: EmploymentStatus = faker.helpers.weightedArrayElement([
      { value: 'active', weight: 85 },
      { value: 'on-leave', weight: 8 },
      { value: 'inactive', weight: 7 },
    ])
    const joiningDate = faker.date.between({ from: '2019-01-01', to: '2026-08-01' })

    const employee: Employee = {
      id,
      employeeCode: id,
      firstName,
      lastName,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
      email: faker.internet
        .email({ firstName, lastName, provider: 'vcorp.com' })
        .toLowerCase(),
      phone: faker.phone.number({ style: 'international' }),
      departmentId: dept.id,
      designation: faker.helpers.arrayElement(designations),
      managerId: null,
      joiningDate: joiningDate.toISOString(),
      employmentStatus: status,
      location: faker.helpers.arrayElement(LOCATIONS),
      baseSalary: faker.number.int({ min: 45000, max: 260000 }),
      address: faker.location.streetAddress({ useFullAddress: true }),
      dateOfBirth: faker.date.birthdate({ min: 22, max: 58, mode: 'age' }).toISOString(),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number({ style: 'international' }),
    }

    employees.push(employee)
    managersByDept[dept.id] = managersByDept[dept.id] ?? []
  }

  // Assign a manager per department (most senior designation) and wire reports to them.
  for (const dept of departments) {
    const deptEmployees = employees.filter((e) => e.departmentId === dept.id)
    if (deptEmployees.length === 0) continue
    const manager = deptEmployees.reduce((a, b) =>
      new Date(a.joiningDate).getTime() < new Date(b.joiningDate).getTime() ? a : b,
    )
    dept.headEmployeeId = manager.id
    for (const emp of deptEmployees) {
      if (emp.id !== manager.id) emp.managerId = manager.id
    }
  }

  return employees
}

export function buildLeaveRequestsAndBalances(employees: Array<Employee>): {
  requests: Array<LeaveRequest>
  balances: Array<LeaveBalance>
} {
  const leaveTypes: Array<LeaveType> = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity/Paternity']
  const allocations: Record<LeaveType, number> = {
    Annual: 18,
    Sick: 10,
    Casual: 8,
    Unpaid: 0,
    'Maternity/Paternity': 26,
  }

  const requests: Array<LeaveRequest> = []
  const balances: Array<LeaveBalance> = []
  let reqCounter = 1

  for (const emp of employees) {
    const numRequests = faker.number.int({ min: 1, max: 5 })
    const usedByType: Record<string, number> = {}
    const pendingByType: Record<string, number> = {}

    for (let i = 0; i < numRequests; i++) {
      const leaveType = faker.helpers.arrayElement(leaveTypes.filter((t) => t !== 'Unpaid' || Math.random() < 0.1))
      const start = faker.date.between({ from: '2026-01-01', to: '2026-12-15' })
      const days = faker.number.int({ min: 1, max: 5 })
      const end = new Date(start)
      end.setDate(end.getDate() + days - 1)
      const status: LeaveStatus = faker.helpers.weightedArrayElement([
        { value: 'Approved', weight: 60 },
        { value: 'Pending', weight: 25 },
        { value: 'Rejected', weight: 15 },
      ])

      const request: LeaveRequest = {
        id: toId('LR', reqCounter++),
        employeeId: emp.id,
        leaveType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        days,
        reason: faker.helpers.arrayElement([
          'Family function', 'Not feeling well', 'Personal work', 'Travel plans',
          'Medical appointment', 'Rest and recovery', 'Out of station', 'Festival celebration',
        ]),
        status,
        appliedOn: faker.date.recent({ days: 60, refDate: start }).toISOString(),
        decidedOn: status === 'Pending' ? null : faker.date.soon({ days: 3, refDate: start }).toISOString(),
        decisionNote: status === 'Rejected' ? 'Insufficient balance / coverage conflict.' : status === 'Approved' ? 'Approved as requested.' : null,
      }
      requests.push(request)

      if (status === 'Approved') usedByType[leaveType] = (usedByType[leaveType] ?? 0) + days
      if (status === 'Pending') pendingByType[leaveType] = (pendingByType[leaveType] ?? 0) + days
    }

    for (const type of leaveTypes) {
      balances.push({
        employeeId: emp.id,
        leaveType: type,
        allocated: allocations[type],
        used: usedByType[type] ?? 0,
        pending: pendingByType[type] ?? 0,
      })
    }
  }

  return { requests, balances }
}

export function buildAttendance(employees: Array<Employee>): Array<AttendanceRecord> {
  const records: Array<AttendanceRecord> = []
  const today = new Date('2026-09-08T00:00:00')
  const days = 21
  let counter = 1

  for (const emp of employees) {
    for (let d = 0; d < days; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      const dow = date.getDay()
      const dateStr = toDateKey(date)

      let status: AttendanceStatus
      let checkIn: string | null = null
      let checkOut: string | null = null
      let workingHours = 0

      if (dow === 0 || dow === 6) {
        status = 'Weekend'
      } else if (emp.employmentStatus === 'on-leave' && d < 3) {
        status = 'On Leave'
      } else {
        status = faker.helpers.weightedArrayElement([
          { value: 'Present', weight: 78 },
          { value: 'Late', weight: 10 },
          { value: 'Half Day', weight: 5 },
          { value: 'On Leave', weight: 4 },
          { value: 'Absent', weight: 3 },
        ])
      }

      if (status === 'Present' || status === 'Late' || status === 'Half Day') {
        const inHour = status === 'Late' ? faker.number.int({ min: 10, max: 11 }) : faker.number.int({ min: 8, max: 9 })
        const inMin = faker.number.int({ min: 0, max: 59 })
        checkIn = `${pad2(inHour)}:${pad2(inMin)}`
        const durationHours = status === 'Half Day' ? faker.number.float({ min: 3.5, max: 4.5, fractionDigits: 1 }) : faker.number.float({ min: 7.5, max: 9.2, fractionDigits: 1 })
        workingHours = Number(durationHours.toFixed(1))
        const outTotalMin = inHour * 60 + inMin + Math.round(durationHours * 60)
        checkOut = `${pad2(Math.floor(outTotalMin / 60) % 24)}:${pad2(outTotalMin % 60)}`
      }

      records.push({
        id: toId('ATT', counter++),
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        workingHours,
        status,
      })
    }
  }

  return records
}

export function buildPayroll(employees: Array<Employee>): Array<PayrollRecord> {
  const records: Array<PayrollRecord> = []
  const months = ['2026-06', '2026-07', '2026-08', '2026-09']
  let counter = 1

  for (const emp of employees) {
    months.forEach((month, idx) => {
      const basic = emp.baseSalary
      const allowances = Math.round(basic * faker.number.float({ min: 0.08, max: 0.18, fractionDigits: 2 }))
      const deductions = Math.round(basic * faker.number.float({ min: 0.02, max: 0.06, fractionDigits: 2 }))
      const tax = Math.round(basic * faker.number.float({ min: 0.1, max: 0.2, fractionDigits: 2 }))
      const netPay = basic + allowances - deductions - tax
      const isCurrentMonth = idx === months.length - 1
      const status: PayrollStatus = isCurrentMonth
        ? faker.helpers.weightedArrayElement([
            { value: 'Draft', weight: 30 },
            { value: 'Processing', weight: 40 },
            { value: 'Completed', weight: 30 },
          ])
        : 'Completed'

      records.push({
        id: toId('PAY', counter++),
        employeeId: emp.id,
        month,
        basic,
        allowances,
        deductions,
        tax,
        netPay,
        status,
        processedOn: status === 'Completed' ? faker.date.past({ years: 0.2 }).toISOString() : null,
      })
    })
  }

  return records
}

export function buildActivityLog(employees: Array<Employee>, departments: Array<Department>): Array<ActivityLogEntry> {
  const entries: Array<ActivityLogEntry> = []
  const types: Array<ActivityLogEntry['type']> = ['employee', 'leave', 'department', 'payroll', 'attendance']

  for (let i = 0; i < 14; i++) {
    const emp = faker.helpers.arrayElement(employees)
    const type = faker.helpers.arrayElement(types)
    const dept = faker.helpers.arrayElement(departments)
    const messages: Record<ActivityLogEntry['type'], string> = {
      employee: `${emp.firstName} ${emp.lastName}'s profile was updated.`,
      leave: `${emp.firstName} ${emp.lastName} submitted a leave request.`,
      department: `${dept.name} department details were updated.`,
      payroll: `Payroll processed for ${emp.firstName} ${emp.lastName}.`,
      attendance: `${emp.firstName} ${emp.lastName} checked in late.`,
      auth: `${emp.firstName} ${emp.lastName} signed in.`,
    }
    entries.push({
      id: toId('ACT', i + 1),
      message: messages[type],
      timestamp: faker.date.recent({ days: 10 }).toISOString(),
      actor: `${emp.firstName} ${emp.lastName}`,
      type,
    })
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function defaultOrganizationSettings(): OrganizationSettings {
  return {
    name: 'V Corp',
    legalName: 'V Corp Technologies Pvt. Ltd.',
    industry: 'Software & Technology',
    website: 'https://vcorp.example.com',
    address: '4th Floor, Prestige Tech Park, Chennai, India',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    workWeekStart: 'Monday',
  }
}

export function defaultNotificationSettings(): NotificationSettings {
  return {
    emailLeaveRequests: true,
    emailPayrollUpdates: true,
    emailNewJoiners: false,
    productAnnouncements: false,
  }
}

export function defaultAppearanceSettings(): AppearanceSettings {
  return { theme: 'light', density: 'comfortable' }
}

// A pre-seeded demo HR admin account so the login screen has known credentials.
// passwordHash is a mock plain-text-in-base64 placeholder — this app has no real backend.
export function buildDemoUser(): AuthUser {
  return {
    id: 'USR-0001',
    name: 'Aarav Mehta',
    email: 'admin@vcorp.com',
    role: 'HR Admin',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=USR-0001',
    passwordHash: btoa('vcorp123'),
  }
}
