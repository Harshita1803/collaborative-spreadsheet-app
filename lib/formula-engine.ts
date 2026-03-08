import type { CellData } from '@/types/spreadsheet'

// Convert column letter to index (A = 0, B = 1, etc.)
export function columnToIndex(col: string): number {
  let index = 0
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64)
  }
  return index - 1
}

// Convert index to column letter (0 = A, 1 = B, etc.)
export function indexToColumn(index: number): string {
  let col = ''
  let temp = index + 1
  while (temp > 0) {
    const remainder = (temp - 1) % 26
    col = String.fromCharCode(65 + remainder) + col
    temp = Math.floor((temp - 1) / 26)
  }
  return col
}

// Parse cell reference (e.g., "A1" -> { col: 0, row: 0 })
export function parseCellReference(ref: string): { col: number; row: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match) return null
  return {
    col: columnToIndex(match[1].toUpperCase()),
    row: parseInt(match[2], 10) - 1,
  }
}

// Get cell key from column and row
export function getCellKey(col: number, row: number): string {
  return `${indexToColumn(col)}${row + 1}`
}

// Parse range (e.g., "A1:B5" -> array of cell keys)
export function parseRange(range: string): string[] {
  const parts = range.split(':')
  if (parts.length !== 2) return []

  const start = parseCellReference(parts[0])
  const end = parseCellReference(parts[1])
  if (!start || !end) return []

  const cells: string[] = []
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
    for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
      cells.push(getCellKey(col, row))
    }
  }
  return cells
}

// Get numeric value from cell
function getCellValue(cellKey: string, cells: Record<string, CellData>, visited: Set<string>): number {
  if (visited.has(cellKey)) {
    throw new Error('Circular reference detected')
  }
  
  const cell = cells[cellKey]
  if (!cell) return 0

  if (cell.formula) {
    visited.add(cellKey)
    const result = evaluateFormula(cell.formula, cells, visited)
    visited.delete(cellKey)
    return result
  }

  const num = parseFloat(cell.value)
  return isNaN(num) ? 0 : num
}

// Get values from range or single cell
function getValues(arg: string, cells: Record<string, CellData>, visited: Set<string>): number[] {
  arg = arg.trim()
  
  // Check if it's a range
  if (arg.includes(':')) {
    const cellKeys = parseRange(arg)
    return cellKeys.map((key) => getCellValue(key, cells, new Set(visited)))
  }
  
  // Check if it's a cell reference
  if (parseCellReference(arg)) {
    return [getCellValue(arg.toUpperCase(), cells, new Set(visited))]
  }
  
  // It's a number
  const num = parseFloat(arg)
  return isNaN(num) ? [0] : [num]
}

// Evaluate formula
export function evaluateFormula(
  formula: string,
  cells: Record<string, CellData>,
  visited: Set<string> = new Set()
): number {
  // Remove leading =
  let expr = formula.startsWith('=') ? formula.slice(1).trim() : formula.trim()

  // Handle functions
  const functionMatch = expr.match(/^(SUM|AVERAGE|AVG|MIN|MAX|COUNT|IF)\s*\(\s*(.+)\s*\)$/i)
  if (functionMatch) {
    const func = functionMatch[1].toUpperCase()
    const args = functionMatch[2]

    switch (func) {
      case 'SUM': {
        const values = getValues(args, cells, visited)
        return values.reduce((a, b) => a + b, 0)
      }
      case 'AVERAGE':
      case 'AVG': {
        const values = getValues(args, cells, visited)
        if (values.length === 0) return 0
        return values.reduce((a, b) => a + b, 0) / values.length
      }
      case 'MIN': {
        const values = getValues(args, cells, visited)
        if (values.length === 0) return 0
        return Math.min(...values)
      }
      case 'MAX': {
        const values = getValues(args, cells, visited)
        if (values.length === 0) return 0
        return Math.max(...values)
      }
      case 'COUNT': {
        const values = getValues(args, cells, visited)
        return values.filter((v) => v !== 0).length
      }
      case 'IF': {
        // Simple IF: IF(condition, trueValue, falseValue)
        const parts = splitArgs(args)
        if (parts.length !== 3) return 0
        const condition = evaluateExpression(parts[0], cells, visited)
        return condition !== 0
          ? evaluateExpression(parts[1], cells, visited)
          : evaluateExpression(parts[2], cells, visited)
      }
    }
  }

  // Handle arithmetic expressions
  return evaluateExpression(expr, cells, visited)
}

// Split function arguments respecting parentheses
function splitArgs(args: string): string[] {
  const result: string[] = []
  let current = ''
  let depth = 0

  for (const char of args) {
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) result.push(current.trim())
  return result
}

// Evaluate arithmetic expression
function evaluateExpression(
  expr: string,
  cells: Record<string, CellData>,
  visited: Set<string>
): number {
  expr = expr.trim()

  // Handle parentheses
  while (expr.includes('(')) {
    expr = expr.replace(/\(([^()]+)\)/g, (_, inner) => {
      return String(evaluateExpression(inner, cells, visited))
    })
  }

  // Replace cell references with their values
  expr = expr.replace(/[A-Z]+\d+/gi, (match) => {
    return String(getCellValue(match.toUpperCase(), cells, new Set(visited)))
  })

  // Simple arithmetic evaluation
  try {
    // Only allow numbers, operators, and spaces
    if (!/^[\d\s+\-*/().]+$/.test(expr)) {
      return 0
    }
    // Use Function constructor for safe evaluation
    const result = new Function(`return ${expr}`)()
    return typeof result === 'number' && !isNaN(result) ? result : 0
  } catch {
    return 0
  }
}

// Get computed value for display
export function getComputedValue(
  cell: CellData | undefined,
  cells: Record<string, CellData>
): string {
  if (!cell) return ''
  
  if (cell.formula) {
    try {
      const result = evaluateFormula(cell.formula, cells)
      // Format number nicely
      if (Number.isInteger(result)) {
        return String(result)
      }
      return result.toFixed(2).replace(/\.?0+$/, '')
    } catch (error) {
      return '#ERROR'
    }
  }
  
  return cell.value
}
