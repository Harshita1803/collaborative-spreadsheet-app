export interface CellData {
  value: string
  formula?: string
}

export interface SpreadsheetDocument {
  id: string
  title: string
  ownerId: string
  ownerEmail: string
  createdAt: number
  updatedAt: number
}

export interface SpreadsheetData {
  cells: Record<string, CellData>
}

export interface UserPresence {
  oderId: string
  email: string
  displayName: string
  photoURL: string | null
  lastSeen: number
  activeCell?: string
}

export type SyncStatus = 'synced' | 'syncing' | 'error'
