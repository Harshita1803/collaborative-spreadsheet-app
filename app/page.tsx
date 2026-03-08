'use client'

import { useAuth } from '@/contexts/auth-context'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'
import { Spinner } from '@/components/ui/spinner'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard />
}
