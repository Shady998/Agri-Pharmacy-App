import { Suspense, lazy, useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react"
import { Toaster } from "react-hot-toast"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import Layout from "./app/layout/Layout"
import "./styles/index.css"
import { MockClerkProvider, MockSignedIn, MockSignedOut, MockRedirectToSignIn, MockUserButton } from "./shared/auth/MockClerkProvider"
import { TooltipProvider } from "./shared/components/ui/tooltip"
import { useClerkToken } from "./shared/auth/useClerkToken"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const Dashboard = lazy(() => import("./features/reports/Dashboard"))
const Products = lazy(() => import("./features/products/ProductsPage"))
const Inventory = lazy(() => import("./features/inventory/InventoryPage"))
const Customers = lazy(() => import("./features/customers/CustomersPage"))
const Debts = lazy(() => import("./features/debts/DebtsPage"))
const Sales = lazy(() => import("./features/sales/SalesPage"))
const Expenses = lazy(() => import("./features/expenses/ExpensesPage"))
const Reports = lazy(() => import("./features/reports/ReportsPage"))
const Settings = lazy(() => import("./features/settings/SettingsPage"))
const Users = lazy(() => import("./features/settings/UsersPage"))

function LoadingFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    return <MockSignedIn>{children}</MockSignedIn>
  }
  return (
    <SignedIn>
      {children}
    </SignedIn>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    return <MockSignedOut>{children}</MockSignedOut>
  }
  return (
    <SignedOut>
      {children}
    </SignedOut>
  )
}

function AppRoutes() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const RedirectToAuth = publishableKey ? RedirectToSignIn : MockRedirectToSignIn
  
  return (
    <Routes>
      <Route path="/sign-in" element={<PublicRoute><RedirectToAuth /></PublicRoute>} />
      <Route path="/sign-up" element={<PublicRoute><RedirectToAuth /></PublicRoute>} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
        <Route path="products" element={<Suspense fallback={<LoadingFallback />}><Products /></Suspense>} />
        <Route path="inventory" element={<Suspense fallback={<LoadingFallback />}><Inventory /></Suspense>} />
        <Route path="customers" element={<Suspense fallback={<LoadingFallback />}><Customers /></Suspense>} />
        <Route path="debts" element={<Suspense fallback={<LoadingFallback />}><Debts /></Suspense>} />
        <Route path="sales" element={<Suspense fallback={<LoadingFallback />}><Sales /></Suspense>} />
        <Route path="expenses" element={<Suspense fallback={<LoadingFallback />}><Expenses /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><Reports /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<LoadingFallback />}><Users /></Suspense>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function ClerkTokenProvider() {
  useClerkToken()
  return null
}

export default function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    return (
      <TooltipProvider>
        <MockClerkProvider>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <BrowserRouter>
                <AppRoutes />
                <Toaster position="top-right" toastOptions={{ duration: 4000, style: { direction: 'rtl' } }} />
                <ReactQueryDevtools initialIsOpen={false} />
              </BrowserRouter>
            </I18nextProvider>
          </QueryClientProvider>
        </MockClerkProvider>
      </TooltipProvider>
    )
  }
  
  return (
    <TooltipProvider>
      <ClerkProvider publishableKey={publishableKey}>
        <ClerkTokenProvider />
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <BrowserRouter>
              <AppRoutes />
              <Toaster position="top-right" toastOptions={{ duration: 4000, style: { direction: 'rtl' } }} />
              <ReactQueryDevtools initialIsOpen={false} />
            </BrowserRouter>
          </I18nextProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </TooltipProvider>
  )
}