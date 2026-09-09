// Core domain types for the V Corp People HRMS MVP.

export type EmploymentStatus = 'active' | 'inactive' | 'on-leave'

export interface Department {
  id: string
  name: string
  description: string
  headEmployeeId: string | null
  color: string
  createdAt: string
}

export interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  avatarUrl: string
  email: string
  phone: string
  departmentId: string
  designation: string
  managerId: string | null
  joiningDate: string
  employmentStatus: EmploymentStatus
  location: string
  baseSalary: number
  address: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  emergencyContactName: string
  emergencyContactPhone: string
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid' | 'Maternity/Paternity'

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  appliedOn: string
  decidedOn: string | null
  decisionNote: string | null
}

export interface LeaveBalance {
  employeeId: string
  leaveType: LeaveType
  allocated: number
  used: number
  pending: number
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Weekend'

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  workingHours: number
  status: AttendanceStatus
}

export type PayrollStatus = 'Draft' | 'Processing' | 'Completed'

export interface PayrollRecord {
  id: string
  employeeId: string
  month: string // YYYY-MM
  basic: number
  allowances: number
  deductions: number
  tax: number
  netPay: number
  status: PayrollStatus
  processedOn: string | null
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'HR Admin'
  avatarUrl: string
  passwordHash: string
}

export interface Session {
  userId: string
  token: string
  createdAt: string
}

export interface OrganizationSettings {
  name: string
  legalName: string
  industry: string
  website: string
  address: string
  timezone: string
  workWeekStart: 'Sunday' | 'Monday'
}

export interface NotificationSettings {
  emailLeaveRequests: boolean
  emailPayrollUpdates: boolean
  emailNewJoiners: boolean
  productAnnouncements: boolean
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  density: 'comfortable' | 'compact'
}

export interface ActivityLogEntry {
  id: string
  message: string
  timestamp: string
  actor: string
  type: 'employee' | 'leave' | 'department' | 'payroll' | 'attendance' | 'auth'
}
