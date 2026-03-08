'use client'

import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react'
import type { SyncStatus } from '@/types/spreadsheet'
import { cn } from '@/lib/utils'

interface SyncIndicatorProps {
  status: SyncStatus
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
        status === 'synced' && 'bg-primary/10 text-primary',
        status === 'syncing' && 'bg-muted text-muted-foreground',
        status === 'error' && 'bg-destructive/10 text-destructive'
      )}
    >
      {status === 'synced' && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
      {status === 'syncing' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="h-3.5 w-3.5" />
          <span>Error</span>
        </>
      )}
    </div>
  )
}
