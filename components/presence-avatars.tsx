'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserPresence } from '@/types/spreadsheet'
import { cn } from '@/lib/utils'

interface PresenceAvatarsProps {
  users: UserPresence[]
  currentUserId?: string
  maxDisplay?: number
}

export function PresenceAvatars({
  users,
  currentUserId,
  maxDisplay = 5,
}: PresenceAvatarsProps) {
  // Filter out current user and show recent users first
  const otherUsers = users
    .filter((u) => u.oderId !== currentUserId)
    .slice(0, maxDisplay)

  const remainingCount = Math.max(
    0,
    users.filter((u) => u.oderId !== currentUserId).length - maxDisplay
  )

  if (otherUsers.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Only you</span>
    )
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {otherUsers.map((user, index) => (
          <Avatar
            key={user.oderId}
            className={cn(
              'h-7 w-7 border-2 border-background ring-0',
              'transition-transform hover:z-10 hover:scale-110'
            )}
            style={{ zIndex: otherUsers.length - index }}
          >
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="ml-2 text-xs text-muted-foreground">
        {otherUsers.length + (remainingCount > 0 ? remainingCount : 0)} online
      </span>
    </div>
  )
}
