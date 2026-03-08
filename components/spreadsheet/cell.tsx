'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { getComputedValue } from '@/lib/formula-engine'
import type { CellData } from '@/types/spreadsheet'

interface CellProps {
  cellKey: string
  data: CellData | undefined
  allCells: Record<string, CellData>
  isSelected: boolean
  onSelect: () => void
  onUpdate: (value: string) => void
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => void
}

export const Cell = memo(function Cell({
  cellKey,
  data,
  allCells,
  isSelected,
  onSelect,
  onUpdate,
  onNavigate,
}: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = getComputedValue(data, allCells)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditValue(data?.formula || data?.value || '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onUpdate(editValue)
        setIsEditing(false)
        onNavigate('down')
      } else if (e.key === 'Escape') {
        setIsEditing(false)
        setEditValue('')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        onUpdate(editValue)
        setIsEditing(false)
        onNavigate(e.shiftKey ? 'shift-tab' : 'tab')
      }
    } else {
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault()
        handleDoubleClick()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onUpdate('')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onNavigate('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onNavigate('down')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onNavigate('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNavigate('right')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        onNavigate(e.shiftKey ? 'shift-tab' : 'tab')
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Start editing with the typed character
        setIsEditing(true)
        setEditValue(e.key)
      }
    }
  }

  const handleBlur = () => {
    if (isEditing) {
      onUpdate(editValue)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={cn(
        'flex h-8 min-w-[100px] items-center border-b border-r border-cell-border bg-background px-2 text-sm outline-none transition-colors',
        isSelected && 'ring-2 ring-inset ring-primary',
        !isEditing && 'cursor-cell'
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelected ? 0 : -1}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          className="h-full w-full bg-transparent text-sm outline-none"
        />
      ) : (
        <span className={cn(
          'truncate',
          displayValue === '#ERROR' && 'text-destructive'
        )}>
          {displayValue}
        </span>
      )}
    </div>
  )
})
