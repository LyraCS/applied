// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  user: null as { id: string; name: string; email: string } | null,
  loading: false,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: auth.user,
    loading: auth.loading,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}))

import { ProtectedRoute } from './ProtectedRoute'

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

function LoginScreen() {
  const from = (useLocation().state as { from?: string } | null)?.from
  return (
    <div>
      <p>Login screen</p>
      <span data-testid="login-from">{from ?? 'none'}</span>
    </div>
  )
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/applications']}>
      <Routes>
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <p>Private screen</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginScreen />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.user = null
  auth.loading = false
})

afterEach(cleanup)

describe('ProtectedRoute', () => {
  it('redirects to /login and remembers where the user wanted to go', () => {
    renderProtectedRoute()

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Private screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(screen.getByTestId('login-from')).toHaveTextContent('/applications')
  })

  it('waits for the session check before deciding to redirect', () => {
    auth.loading = true
    renderProtectedRoute()

    expect(screen.getByText('Checking your session…')).toBeInTheDocument()
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/applications')
  })

  it('renders the screen for a signed-in user', () => {
    auth.user = { id: 'u1', name: 'Ada', email: 'ada@example.com' }
    renderProtectedRoute()

    expect(screen.getByText('Private screen')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/applications')
  })
})
