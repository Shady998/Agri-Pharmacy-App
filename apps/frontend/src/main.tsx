import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { MockClerkProvider } from './shared/auth/MockClerkProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import i18n from './i18n'
import App from './App'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const RootProvider = publishableKey ? ClerkProvider : MockClerkProvider
const rootProps = publishableKey ? { publishableKey } : {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootProvider {...rootProps}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { direction: 'rtl' } }} />
          <ReactQueryDevtools initialIsOpen={false} />
        </I18nextProvider>
      </QueryClientProvider>
    </RootProvider>
  </React.StrictMode>,
)