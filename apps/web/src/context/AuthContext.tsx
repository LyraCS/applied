import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, postJson } from '../lib/api'

export type AuthUser = { id: string; name: string; email: string }
type AuthResponse = { user: AuthUser }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    // The token is httpOnly, so the browser cannot read it. Asking /me on
    // page load is how the UI discovers who (if anyone) is signed in.
    apiFetch<AuthResponse>('/auth/me')
      .then((data) => {
        if (active) setUser(data.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function signIn(email: string, password: string) {
    const data = await postJson<AuthResponse>('/auth/login', { email, password })
    setUser(data.user)
  }

  async function signUp(name: string, email: string, password: string) {
    const data = await postJson<AuthResponse>('/auth/register', { name, email, password })
    setUser(data.user)
  }

  async function signOut() {
    await postJson('/auth/logout', {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
