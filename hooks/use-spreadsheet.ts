'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, onValue, set, update, serverTimestamp } from 'firebase/database'
import { database } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import type { CellData, SpreadsheetData, SyncStatus, UserPresence } from '@/types/spreadsheet'

const DEBOUNCE_MS = 500

export function useSpreadsheet(documentId: string) {
  const { user } = useAuth()
  const [cells, setCells] = useState<Record<string, CellData>>({})
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [presence, setPresence] = useState<UserPresence[]>([])
  const pendingUpdates = useRef<Record<string, CellData>>({})
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Subscribe to spreadsheet data
  useEffect(() => {
    if (!documentId) return

    const spreadsheetRef = ref(database, `spreadsheets/${documentId}/cells`)
    const unsubscribe = onValue(spreadsheetRef, (snapshot) => {
      const data = snapshot.val() as Record<string, CellData> | null
      setCells(data || {})
    })

    return () => unsubscribe()
  }, [documentId])

  // Subscribe to presence
  useEffect(() => {
    if (!documentId) return

    const presenceRef = ref(database, `presence/${documentId}`)
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() as Record<string, UserPresence> | null
      if (data) {
        const now = Date.now()
        // Filter out stale presence (older than 2 minutes)
        const activeUsers = Object.values(data).filter(
          (p) => now - p.lastSeen < 120000
        )
        setPresence(activeUsers)
      } else {
        setPresence([])
      }
    })

    return () => unsubscribe()
  }, [documentId])

  // Update user presence
  useEffect(() => {
    if (!documentId || !user) return

    const userPresenceRef = ref(database, `presence/${documentId}/${user.uid}`)
    
    const updatePresence = () => {
      set(userPresenceRef, {
        oderId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        photoURL: user.photoURL,
        lastSeen: Date.now(),
      })
    }

    // Update immediately and then every 30 seconds
    updatePresence()
    const interval = setInterval(updatePresence, 30000)

    // Clean up presence on unmount
    return () => {
      clearInterval(interval)
      set(userPresenceRef, null)
    }
  }, [documentId, user])

  // Flush pending updates to Firebase
  const flushUpdates = useCallback(async () => {
    if (Object.keys(pendingUpdates.current).length === 0) return

    setSyncStatus('syncing')
    try {
      const updates: Record<string, CellData | null> = {}
      for (const [key, value] of Object.entries(pendingUpdates.current)) {
        updates[`spreadsheets/${documentId}/cells/${key}`] = value.value || value.formula ? value : null
      }
      updates[`documents/${documentId}/updatedAt`] = { value: String(Date.now()) } as unknown as CellData

      await update(ref(database), updates)
      pendingUpdates.current = {}
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error syncing:', error)
      setSyncStatus('error')
    }
  }, [documentId])

  // Update cell with debouncing
  const updateCell = useCallback(
    (cellKey: string, value: string) => {
      const isFormula = value.startsWith('=')
      const cellData: CellData = isFormula
        ? { value: '', formula: value }
        : { value }

      // Optimistic update
      setCells((prev) => ({
        ...prev,
        [cellKey]: cellData,
      }))

      // Queue for sync
      pendingUpdates.current[cellKey] = cellData

      // Debounce the sync
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(flushUpdates, DEBOUNCE_MS)
    },
    [flushUpdates]
  )

  // Update active cell for presence
  const updateActiveCell = useCallback(
    (cellKey: string | undefined) => {
      if (!documentId || !user) return

      const userPresenceRef = ref(database, `presence/${documentId}/${user.uid}`)
      update(userPresenceRef, {
        activeCell: cellKey || null,
        lastSeen: Date.now(),
      })
    },
    [documentId, user]
  )

  return {
    cells,
    updateCell,
    syncStatus,
    presence,
    updateActiveCell,
  }
}
