'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { SpreadsheetEditor } from '@/components/spreadsheet/editor'
import { Spinner } from '@/components/ui/spinner'
import { ref, get } from 'firebase/database'
import { database } from '@/lib/firebase'

interface SheetPageProps {
  params: Promise<{ id: string }>
}

export default function SheetPage({ params }: SheetPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [title, setTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    // Fetch document info
    const fetchDocument = async () => {
      try {
        const docRef = ref(database, `documents/${id}`)
        const snapshot = await get(docRef)
        
        if (!snapshot.exists()) {
          setError('Document not found')
          return
        }

        const data = snapshot.val()
        setTitle(data.title)
      } catch (err) {
        console.error('Error fetching document:', err)
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [id, user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-primary underline"
        >
          Go back to dashboard
        </button>
      </div>
    )
  }

  if (!title) {
    return null
  }

  return <SpreadsheetEditor documentId={id} initialTitle={title} />
}
