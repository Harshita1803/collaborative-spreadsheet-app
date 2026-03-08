'use client'

import { useState, useEffect, useCallback } from 'react'
import { ref, onValue, push, set, remove, update } from 'firebase/database'
import { database } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import type { SpreadsheetDocument } from '@/types/spreadsheet'

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([])
  const [loading, setLoading] = useState(true)

  // Subscribe to user's documents
  useEffect(() => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }

    const documentsRef = ref(database, 'documents')
    const unsubscribe = onValue(documentsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<SpreadsheetDocument, 'id'>> | null
      if (data) {
        const docs = Object.entries(data)
          .map(([id, doc]) => ({ ...doc, id }))
          .filter((doc) => doc.ownerId === user.uid)
          .sort((a, b) => b.updatedAt - a.updatedAt)
        setDocuments(docs)
      } else {
        setDocuments([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Create a new document
  const createDocument = useCallback(
    async (title: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated')

      const documentsRef = ref(database, 'documents')
      const newDocRef = push(documentsRef)
      const now = Date.now()

      const newDoc: Omit<SpreadsheetDocument, 'id'> = {
        title,
        ownerId: user.uid,
        ownerEmail: user.email || '',
        createdAt: now,
        updatedAt: now,
      }

      await set(newDocRef, newDoc)
      return newDocRef.key!
    },
    [user]
  )

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string) => {
    await remove(ref(database, `documents/${documentId}`))
    await remove(ref(database, `spreadsheets/${documentId}`))
    await remove(ref(database, `presence/${documentId}`))
  }, [])

  // Rename a document
  const renameDocument = useCallback(async (documentId: string, newTitle: string) => {
    await update(ref(database, `documents/${documentId}`), {
      title: newTitle,
      updatedAt: Date.now(),
    })
  }, [])

  return {
    documents,
    loading,
    createDocument,
    deleteDocument,
    renameDocument,
  }
}
