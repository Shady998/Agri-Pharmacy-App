import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

export function useClerkToken() {
  const { getToken, isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const refreshToken = async () => {
      try {
        const token = await getToken()
        if (token) {
          localStorage.setItem('clerk_token', token)
        }
      } catch (error) {
        console.error('Failed to get Clerk token:', error)
      }
    }

    refreshToken()

    const interval = setInterval(refreshToken, 60 * 1000)
    return () => clearInterval(interval)
  }, [isLoaded, isSignedIn, getToken])
}