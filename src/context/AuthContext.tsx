import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '#/types'
import * as authLib from '#/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  isInitializing: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => void
  updateProfile: (input: { name: string; email: string; avatarUrl: string }) => AuthUser
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    setUser(authLib.getCurrentUser())
    setIsInitializing(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      login: async (email, password) => {
        const u = await authLib.login(email, password)
        setUser(u)
        return u
      },
      signUp: async (input) => {
        const u = await authLib.signUp(input)
        setUser(u)
        return u
      },
      logout: () => {
        authLib.logout()
        setUser(null)
      },
      refreshUser: () => setUser(authLib.getCurrentUser()),
      updateProfile: (input) => {
        const u = authLib.updateCurrentUserProfile(input)
        setUser(u)
        return u
      },
    }),
    [user, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
