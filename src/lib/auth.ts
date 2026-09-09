import type { AuthUser, Session } from '#/types'
import { getUsersSync, saveUsersSync } from './db'
import { readStorage, removeStorage, simulateLatency, writeStorage } from './storage'

const SESSION_KEY = 'session'

export class AuthError extends Error {}

function hashPassword(password: string) {
  return btoa(password)
}

export function getSession(): Session | null {
  return readStorage<Session | null>(SESSION_KEY, null)
}

export function getCurrentUser(): AuthUser | null {
  const session = getSession()
  if (!session) return null
  const users = getUsersSync()
  return users.find((u) => u.id === session.userId) ?? null
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await simulateLatency(400, 750)
  const users = getUsersSync()
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new AuthError('Incorrect email or password. Please try again.')
  }
  const session: Session = { userId: user.id, token: `tok_${Date.now()}`, createdAt: new Date().toISOString() }
  writeStorage(SESSION_KEY, session)
  return user
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  await simulateLatency(500, 850)
  const users = getUsersSync()
  const exists = users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())
  if (exists) {
    throw new AuthError('An account with this email already exists.')
  }
  const user: AuthUser = {
    id: `USR-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'HR Admin',
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(input.email)}`,
    passwordHash: hashPassword(input.password),
  }
  saveUsersSync([...users, user])
  const session: Session = { userId: user.id, token: `tok_${Date.now()}`, createdAt: new Date().toISOString() }
  writeStorage(SESSION_KEY, session)
  return user
}

export async function requestPasswordReset(email: string): Promise<{ found: boolean; code: string | null }> {
  await simulateLatency(500, 900)
  const users = getUsersSync()
  const found = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  // Mocked: in a real app this would email a one-time code. Since there is no backend/email
  // provider, we generate the code and hand it back to the caller to display in the UI so the
  // full reset flow can still be demoed end-to-end from the frontend alone.
  const code = found ? String(Math.floor(100000 + Math.random() * 900000)) : null
  return { found, code }
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  await simulateLatency(400, 700)
  const users = getUsersSync()
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (idx === -1) throw new AuthError('Account not found.')
  users[idx] = { ...users[idx], passwordHash: hashPassword(newPassword) }
  saveUsersSync(users)
}

export function logout(): void {
  removeStorage(SESSION_KEY)
}

export function updateCurrentUserProfile(input: { name: string; email: string; avatarUrl: string }): AuthUser {
  const session = getSession()
  if (!session) throw new AuthError('Not authenticated.')
  const users = getUsersSync()
  const idx = users.findIndex((u) => u.id === session.userId)
  if (idx === -1) throw new AuthError('Not authenticated.')
  users[idx] = { ...users[idx], ...input }
  saveUsersSync(users)
  return users[idx]
}
