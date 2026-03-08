'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import type { CellData } from '@/types/spreadsheet'

interface FormulaBarProps {
  selectedCell: string | null
  cellData: CellData | undefined
  onUpdate: (value: string) => void
}

export function FormulaBar({ selectedCell, cellData, onUpdate }: FormulaBarProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(cellData?.formula || cellData?.value || '')
  }, [cellData, selectedCell])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onUpdate(value)
    } else if (e.key === 'Escape') {
      setValue(cellData?.formula || cellData?.value || '')
    }
  }

  const handleBlur = () => {
    onUpdate(value)
  }

  return (
    <div className="flex h-10 items-center gap-2 border-b border-border bg-card px-4">
      <div className="flex h-7 w-16 items-center justify-center rounded bg-muted px-2 text-sm font-medium text-muted-foreground">
        {selectedCell || '--'}
      </div>
      <div className="text-muted-foreground">=</div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
        className="h-7 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
