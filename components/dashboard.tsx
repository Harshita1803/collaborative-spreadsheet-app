'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useDocuments } from '@/hooks/use-documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TableIcon,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { formatDistanceToNow } from 'date-fns'

export function Dashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { documents, loading, createDocument, deleteDocument, renameDocument } =
    useDocuments()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleCreateDocument = async () => {
    setIsCreating(true)
    try {
      const id = await createDocument('Untitled Spreadsheet')
      router.push(`/sheet/${id}`)
    } catch (error) {
      console.error('Error creating document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenDocument = (id: string) => {
    router.push(`/sheet/${id}`)
  }

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this spreadsheet?')) {
      await deleteDocument(id)
    }
  }

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleSaveRename = async (id: string) => {
    if (editingTitle.trim()) {
      await renameDocument(id, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TableIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Harshita1803 Sheets</span>
          </div>

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

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Spreadsheets</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your collaborative spreadsheets
            </p>
          </div>
          <Button onClick={handleCreateDocument} disabled={isCreating} className="gap-2">
            {isCreating ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            New Spreadsheet
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">No spreadsheets yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first spreadsheet to get started
              </p>
              <Button onClick={handleCreateDocument} disabled={isCreating}>
                {isCreating ? <Spinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Spreadsheet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="group cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => handleOpenDocument(doc.id)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-muted/50">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      {editingId === doc.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(doc.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(doc.id)
                            if (e.key === 'Escape') {
                              setEditingId(null)
                              setEditingTitle('')
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      ) : (
                        <h3 className="truncate font-medium text-foreground">{doc.title}</h3>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Modified {formatDistanceToNow(doc.updatedAt, { addSuffix: true })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleStartRename(doc.id, doc.title, e)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
