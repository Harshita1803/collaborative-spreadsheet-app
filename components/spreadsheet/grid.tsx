'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Cell } from './cell'
import { indexToColumn, getCellKey, parseCellReference } from '@/lib/formula-engine'
import type { CellData } from '@/types/spreadsheet'
import { cn } from '@/lib/utils'

interface GridProps {
  cells: Record<string, CellData>
  onCellUpdate: (cellKey: string, value: string) => void
  onCellSelect?: (cellKey: string) => void
  rows?: number
  cols?: number
}

export function Grid({
  cells,
  onCellUpdate,
  onCellSelect,
  rows = 100,
  cols = 26,
}: GridProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>('A1')
  const gridRef = useRef<HTMLDivElement>(null)

  const handleCellSelect = useCallback(
    (cellKey: string) => {
      setSelectedCell(cellKey)
      onCellSelect?.(cellKey)
    },
    [onCellSelect]
  )

  const handleNavigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => {
      if (!selectedCell) return

      const parsed = parseCellReference(selectedCell)
      if (!parsed) return

      let newCol = parsed.col
      let newRow = parsed.row

      switch (direction) {
        case 'up':
          newRow = Math.max(0, newRow - 1)
          break
        case 'down':
          newRow = Math.min(rows - 1, newRow + 1)
          break
        case 'left':
          newCol = Math.max(0, newCol - 1)
          break
        case 'right':
        case 'tab':
          newCol = Math.min(cols - 1, newCol + 1)
          break
        case 'shift-tab':
          newCol = Math.max(0, newCol - 1)
          break
      }

      const newCellKey = getCellKey(newCol, newRow)
      setSelectedCell(newCellKey)
      onCellSelect?.(newCellKey)
    },
    [selectedCell, rows, cols, onCellSelect]
  )

  // Focus the grid when a cell is selected
  useEffect(() => {
    if (selectedCell && gridRef.current) {
      const cellElement = gridRef.current.querySelector(
        `[data-cell="${selectedCell}"]`
      ) as HTMLElement
      cellElement?.focus()
    }
  }, [selectedCell])

  return (
    <div
      ref={gridRef}
      className="spreadsheet-grid relative flex-1 overflow-auto bg-background"
    >
      <div className="inline-block min-w-full">
        {/* Header row with column letters */}
        <div className="sticky top-0 z-20 flex">
          {/* Corner cell */}
          <div className="sticky left-0 z-30 flex h-8 w-12 shrink-0 items-center justify-center border-b border-r border-cell-border bg-header-bg" />
          {/* Column headers */}
          {Array.from({ length: cols }, (_, i) => (
            <div
              key={i}
              className="flex h-8 min-w-[100px] shrink-0 items-center justify-center border-b border-r border-cell-border bg-header-bg text-xs font-medium text-muted-foreground"
            >
              {indexToColumn(i)}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row number */}
            <div className="sticky left-0 z-10 flex h-8 w-12 shrink-0 items-center justify-center border-b border-r border-cell-border bg-header-bg text-xs font-medium text-muted-foreground">
              {rowIndex + 1}
            </div>
            {/* Cells */}
            {Array.from({ length: cols }, (_, colIndex) => {
              const cellKey = getCellKey(colIndex, rowIndex)
              return (
                <div key={cellKey} data-cell={cellKey}>
                  <Cell
                    cellKey={cellKey}
                    data={cells[cellKey]}
                    allCells={cells}
                    isSelected={selectedCell === cellKey}
                    onSelect={() => handleCellSelect(cellKey)}
                    onUpdate={(value) => onCellUpdate(cellKey, value)}
                    onNavigate={handleNavigate}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
