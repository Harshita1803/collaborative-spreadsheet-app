'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSpreadsheet } from '@/hooks/use-spreadsheet'
import { useAuth } from '@/contexts/auth-context'
import { Grid } from './grid'
import { FormulaBar } from './formula-bar'
import { SyncIndicator } from '@/components/sync-indicator'
import { PresenceAvatars } from '@/components/presence-avatars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, LogOut, TableIcon, Pencil, Check, X } from 'lucide-react'
import { ref, update } from 'firebase/database'
import { database } from '@/lib/firebase'

interface SpreadsheetEditorProps {
  documentId: string
  initialTitle: string
}

export function SpreadsheetEditor({ documentId, initialTitle }: SpreadsheetEditorProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { cells, updateCell, syncStatus, presence, updateActiveCell } = useSpreadsheet(documentId)
  const [selectedCell, setSelectedCell] = useState<string | null>('A1')
  const [title, setTitle] = useState(initialTitle)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(initialTitle)

  const handleCellSelect = useCallback(
    (cellKey: string) => {
      setSelectedCell(cellKey)
      updateActiveCell(cellKey)
    },
    [updateActiveCell]
  )

  const handleFormulaUpdate = useCallback(
    (value: string) => {
      if (selectedCell) {
        updateCell(selectedCell, value)
      }
    },
    [selectedCell, updateCell]
  )

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== title) {
      await update(ref(database, `documents/${documentId}`), {
        title: editTitle.trim(),
        updatedAt: Date.now(),
      })
      setTitle(editTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCancelTitleEdit = () => {
    setEditTitle(title)
    setIsEditingTitle(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TableIcon className="h-4 w-4 text-primary" />
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') handleCancelTitleEdit()
                }}
                className="h-8 w-64"
                autoFocus
              />
              <Button variant="ghost" size="icon-sm" onClick={handleSaveTitle}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleCancelTitleEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditTitle(title)
                setIsEditingTitle(true)
              }}
              className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-muted"
            >
              <span className="font-medium text-foreground">{title}</span>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          )}

          <SyncIndicator status={syncStatus} />
        </div>

        <div className="flex items-center gap-4">
          <PresenceAvatars users={presence} currentUserId={user?.uid} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Formula Bar */}
      <FormulaBar
        selectedCell={selectedCell}
        cellData={selectedCell ? cells[selectedCell] : undefined}
        onUpdate={handleFormulaUpdate}
      />

      {/* Grid */}
      <Grid
        cells={cells}
        onCellUpdate={updateCell}
        onCellSelect={handleCellSelect}
      />
    </div>
  )
}
