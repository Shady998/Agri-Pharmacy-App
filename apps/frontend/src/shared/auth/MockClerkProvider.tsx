import React, { createContext, useContext, useState, ReactNode } from 'react'

interface MockUser {
  id: string
  firstName: string
  lastName: string
  emailAddresses: { emailAddress: string }[]
  primaryEmailAddressId: string
}

interface MockAuth {
  userId: string | null
  isSignedIn: boolean
  isLoaded: boolean
  signOut: () => void
}

interface MockClerkContext {
  user: MockUser | null
  auth: MockAuth
  isLoaded: boolean
}

const MockClerkContext = createContext<MockClerkContext | null>(null)

export function useMockClerk() {
  const context = useContext(MockClerkContext)
  if (!context) {
    throw new Error('useMockClerk must be used within MockClerkProvider')
  }
  return context
}

export function useMockAuth() {
  return useMockClerk().auth
}

export function useMockUser() {
  return useMockClerk().user
}

// Pre-generated valid JWT for dev mode (24h expiry)
// secret: 'dev-secret-change-in-production'
// sub: 'dev-user-1', role: 'TENANT_ADMIN', tenantId: 'dev-tenant-1'
const DEV_MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlci0xIiwiZW1haWwiOiJkZXZAYWdyaS1waGFybWFjeS5sb2NhbCIsInRlbmFudElkIjoiZGV2LXRlbmFudC0xIiwicm9sZSI6IlRFTkFOVF9BRE1JTiIsImlhdCI6MTc4OTY2NTk5MiwiZXhwIjoxNzg5NzUyMzkyfQ.-K0WBN_A7H_MPjCMTklkxNQwJc_cDKPmbBLVODjdjDo'

export function MockClerkProvider({ children }: { children: ReactNode }) {
  // Set mock token SYNCHRONOUSLY before any children render
  if (typeof window !== 'undefined') {
    localStorage.setItem('clerk_token', DEV_MOCK_TOKEN)
  }

  const [user] = useState<MockUser>({
    id: 'dev-user-1',
    firstName: 'مطور',
    lastName: 'النظام',
    emailAddresses: [{ emailAddress: 'dev@agri-pharmacy.local' }],
    primaryEmailAddressId: 'dev-user-1',
  })

  const [auth] = useState<MockAuth>({
    userId: 'dev-user-1',
    isSignedIn: true,
    isLoaded: true,
    signOut: () => {},
  })

  return (
    <MockClerkContext.Provider value={{ user, auth, isLoaded: true }}>
      {children}
    </MockClerkContext.Provider>
  )
}

export function MockSignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, auth } = useMockClerk()
  if (!isLoaded) return null
  return auth.isSignedIn ? <>{children}</> : null
}

export function MockSignedOut({ children }: { children: ReactNode }) {
  const { isLoaded, auth } = useMockClerk()
  if (!isLoaded) return null
  return !auth.isSignedIn ? <>{children}</> : null
}

export function MockUserButton({ children }: { children: ReactNode }) {
  const { user } = useMockClerk()
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80">
      <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
      <span className="text-xs text-muted-foreground">(Dev Mode)</span>
    </div>
  )
}

export function MockRedirectToSignIn({ children }: { children?: ReactNode }) {
  return children || null
}