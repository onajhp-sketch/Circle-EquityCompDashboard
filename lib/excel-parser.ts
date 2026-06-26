// Excel/CSV Parser for Equity Compensation Data
// Handles flexible column name matching and multi-tab Excel files

import { type Grant, generateId } from "./calculations"

// Column name aliases for flexible matching
const COLUMN_ALIASES: Record<string, string[]> = {
  // Core identifiers
  recordType: ["record type", "recordtype", "type", "record_type", "grant type", "granttype"],
  symbol: ["symbol", "ticker", "stock symbol", "stock"],
  grantNumber: ["grant number", "grantnumber", "grant_number", "grant id", "grantid", "grant #", "id"],
  grantDate: ["grant date", "grantdate", "grant_date", "date granted", "granted date", "date"],
  
  // Quantity fields
  grantedQty: ["granted qty.", "granted qty", "grantedqty", "granted_qty", "granted quantity", "shares granted", "total shares", "shares"],
  vestedQty: ["vested qty.", "vested qty", "vestedqty", "vested_qty", "vested quantity", "vested shares", "vested"],
  unvestedQty: ["unvested qty.", "unvested qty", "unvestedqty", "unvested_qty", "unvested quantity", "unvested shares", "unvested"],
  exercisableQty: ["exercisable qty.", "exercisable qty", "exercisableqty", "exercisable_qty", "exercisable quantity", "exercisable shares", "exercisable"],
  sellableQty: ["sellable qty.", "sellable qty", "sellableqty", "sellable_qty", "sellable quantity", "sellable shares", "sellable"],
  withheldQty: ["withheld qty.", "withheld qty", "withheldqty", "withheld_qty", "withheld quantity", "withheld shares", "withheld"],
  deferredQty: ["deferred / pending release qty.", "deferred qty", "pending release qty", "deferred", "pending", "deferred_qty"],
  
  // Price fields
  exercisePrice: ["exercise price", "exerciseprice", "exercise_price", "strike price", "strike", "option price", "price"],
  estMarketValue: ["est. market value", "est market value", "market value", "marketvalue", "estimated value", "value", "fmv"],
  
  // Other fields
  settlementType: ["settlement type", "settlementtype", "settlement_type", "settlement"],
  vestDate: ["vest date", "vestdate", "vest_date", "vesting date", "next vest", "full vest date"],
}

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim()
}

// Find matching column from headers
function findColumn(headers: string[], targetKey: string): number {
  const aliases = COLUMN_ALIASES[targetKey] || [targetKey]
  const normalizedHeaders = headers.map(normalizeColumnName)
  
  for (const alias of aliases) {
    const normalizedAlias = normalizeColumnName(alias)
    const index = normalizedHeaders.findIndex(h => h === normalizedAlias || h.includes(normalizedAlias) || normalizedAlias.includes(h))
    if (index !== -1) return index
  }
  return -1
}

// Parse a single row into a grant object
function parseRow(
  row: string[],
  headers: string[],
  tabType: "restricted" | "options" | "unknown",
  index: number,
  currentPrice: number
): Grant | null {
  // Find column indices
  const cols = {
    recordType: findColumn(headers, "recordType"),
    symbol: findColumn(headers, "symbol"),
    grantNumber: findColumn(headers, "grantNumber"),
    grantDate: findColumn(headers, "grantDate"),
    grantedQty: findColumn(headers, "grantedQty"),
    vestedQty: findColumn(headers, "vestedQty"),
    unvestedQty: findColumn(headers, "unvestedQty"),
    exercisableQty: findColumn(headers, "exercisableQty"),
    sellableQty: findColumn(headers, "sellableQty"),
    exercisePrice: findColumn(headers, "exercisePrice"),
    estMarketValue: findColumn(headers, "estMarketValue"),
    vestDate: findColumn(headers, "vestDate"),
  }

  // Get values safely
  const getValue = (colIndex: number): string => {
    if (colIndex === -1 || colIndex >= row.length) return ""
    return (row[colIndex] || "").trim()
  }

  const getNumber = (colIndex: number): number => {
    const val = getValue(colIndex).replace(/[$,]/g, "")
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  // Determine grant type
  let grantType: Grant["type"] = "RSU"
  const recordType = getValue(cols.recordType).toUpperCase()
  
  if (recordType.includes("RSU") || recordType.includes("RESTRICTED")) {
    grantType = "RSU"
  } else if (recordType.includes("ISO")) {
    grantType = "ISO"
  } else if (recordType.includes("NSO") || recordType.includes("NQ") || recordType.includes("OPTION")) {
    grantType = "NSO"
  } else if (recordType.includes("ESPP")) {
    grantType = "ESPP"
  } else if (tabType === "options") {
    // If on options tab and no specific type, default to NSO
    grantType = "NSO"
  } else if (tabType === "restricted") {
    grantType = "RSU"
  }

  // Calculate shares - prefer vested for RSUs, exercisable for options
  let shares = getNumber(cols.grantedQty)
  if (grantType === "RSU" || grantType === "ESPP") {
    // For RSUs, use vested qty if available, otherwise granted qty
    const vested = getNumber(cols.vestedQty)
    if (vested > 0) shares = vested
  } else {
    // For options, use exercisable qty if available
    const exercisable = getNumber(cols.exercisableQty)
    if (exercisable > 0) shares = exercisable
  }

  // Skip if no shares
  if (shares <= 0) return null

  // Get strike price (only for options)
  let strike: number | null = null
  if (grantType === "NSO" || grantType === "ISO") {
    strike = getNumber(cols.exercisePrice)
    if (strike === 0) strike = null
  }

  // Get grant date
  let grantDate = getValue(cols.grantDate)
  if (grantDate) {
    // Try to parse various date formats
    const parsed = new Date(grantDate)
    if (!isNaN(parsed.getTime())) {
      grantDate = parsed.toISOString().split("T")[0]
    }
  }
  if (!grantDate) {
    grantDate = new Date().toISOString().split("T")[0]
  }

  // Get vest date or estimate it
  let vestDate = getValue(cols.vestDate)
  if (vestDate) {
    const parsed = new Date(vestDate)
    if (!isNaN(parsed.getTime())) {
      vestDate = parsed.toISOString().split("T")[0]
    }
  }
  if (!vestDate) {
    // If unvested qty > 0, estimate vest date as 1 year from now
    const unvested = getNumber(cols.unvestedQty)
    if (unvested > 0) {
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      vestDate = future.toISOString().split("T")[0]
    } else {
      // Already vested, use grant date as vest date
      vestDate = grantDate
    }
  }

  // Calculate FMV from market value if available
  let fmvAtVest: number | null = null
  const marketValue = getNumber(cols.estMarketValue)
  if (marketValue > 0 && shares > 0) {
    fmvAtVest = marketValue / shares
  }

  // Generate ID from grant number or index
  const grantNumber = getValue(cols.grantNumber)
  const id = grantNumber || `import-${index}-${Date.now()}`

  // Get symbol/ticker
  const symbol = getValue(cols.symbol).toUpperCase() || undefined

  return {
    id,
    type: grantType,
    symbol,
    shares,
    strike,
    grantDate,
    vestDate,
    fmvAtVest,
  }
}

// Detect tab type from tab name
function detectTabType(tabName: string): "restricted" | "options" | "unknown" {
  const lower = tabName.toLowerCase()
  if (lower.includes("restricted") || lower.includes("rsu") || lower.includes("stock")) {
    return "restricted"
  }
  if (lower.includes("option") || lower.includes("nso") || lower.includes("iso")) {
    return "options"
  }
  return "unknown"
}

// Parse CSV content
export function parseCSV(content: string, currentPrice: number = 50): Grant[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(h => h.trim())
  const grants: Grant[] = []

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV values with commas inside quotes
    const row: string[] = []
    let current = ""
    let inQuotes = false
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        row.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    row.push(current.trim())

    const grant = parseRow(row, headers, "unknown", i, currentPrice)
    if (grant) grants.push(grant)
  }

  return grants
}

// Parse Excel file (XLSX)
export async function parseExcel(file: File, currentPrice: number = 50): Promise<Grant[]> {
  // Dynamic import of xlsx library
  const XLSX = await import("xlsx")
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        
        const allGrants: Grant[] = []
        
        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
          const tabType = detectTabType(sheetName)
          const sheet = workbook.Sheets[sheetName]
          
          // Convert sheet to array of arrays
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })
          
          if (rows.length < 2) continue
          
          const headers = rows[0].map(h => String(h || "").trim())
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i].map(v => String(v || "").trim())
            const grant = parseRow(row, headers, tabType, allGrants.length + i, currentPrice)
            if (grant) {
              // Ensure unique ID
              grant.id = `${sheetName}-${grant.id}-${i}`
              allGrants.push(grant)
            }
          }
        }
        
        resolve(allGrants)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

// Generate template CSV matching client format
export function generateRestrictedStockTemplate(): string {
  const headers = [
    "Record Type",
    "Symbol",
    "Grant Date",
    "Settlement Type",
    "Granted Qty.",
    "Withheld Qty.",
    "Vested Qty.",
    "Unvested Qty.",
    "Deferred / Pending Release Qty.",
    "Sellable Qty.",
    "Est. Market Value",
    "Grant Number"
  ]
  
  const sampleRows = [
    ["RSU", "AAPL", "2023-01-15", "Shares", "1000", "200", "800", "200", "0", "600", "120000", "RSU-2023-001"],
    ["RSU", "AAPL", "2024-06-01", "Shares", "500", "0", "0", "500", "0", "0", "75000", "RSU-2024-002"],
  ]
  
  return [headers.join(","), ...sampleRows.map(r => r.join(","))].join("\n")
}

export function generateOptionsTemplate(): string {
  const headers = [
    "Record Type",
    "Symbol",
    "Grant Date",
    "Granted Qty.",
    "Exercise Price",
    "Unvested Qty.",
    "Exercisable Qty.",
    "Sellable Qty.",
    "Est. Market Value",
    "Grant Number"
  ]
  
  const sampleRows = [
    ["NSO", "AAPL", "2022-03-01", "2000", "125.00", "500", "1500", "1500", "50000", "OPT-2022-001"],
    ["ISO", "AAPL", "2023-09-15", "1500", "150.00", "1500", "0", "0", "0", "OPT-2023-002"],
  ]
  
  return [headers.join(","), ...sampleRows.map(r => r.join(","))].join("\n")
}

// Generate combined template with instructions
export function generateCombinedTemplate(): string {
  const instructions = `# Circle Financial Planning - Grant Import Template
# 
# Instructions:
# 1. This file has two sections: Restricted Stock and Options
# 2. You can import RSUs, ISOs, NSOs, and ESPPs
# 3. Column headers are flexible - the system will match similar names
# 4. For Excel files (.xlsx), use separate tabs named "Restricted Stock" and "Options"
# 5. Delete sample rows before importing your actual data
#
# === RESTRICTED STOCK ===
`
  
  const restrictedHeaders = "Record Type,Symbol,Grant Date,Settlement Type,Granted Qty.,Withheld Qty.,Vested Qty.,Unvested Qty.,Deferred / Pending Release Qty.,Sellable Qty.,Est. Market Value,Grant Number"
  const restrictedSample = "RSU,AAPL,2023-01-15,Shares,1000,200,800,200,0,600,120000,RSU-2023-001"
  
  const optionsSection = `
# === OPTIONS ===
`
  
  const optionsHeaders = "Record Type,Symbol,Grant Date,Granted Qty.,Exercise Price,Unvested Qty.,Exercisable Qty.,Sellable Qty.,Est. Market Value,Grant Number"
  const optionsSample = "NSO,AAPL,2022-03-01,2000,125.00,500,1500,1500,50000,OPT-2022-001"
  
  return instructions + restrictedHeaders + "\n" + restrictedSample + optionsSection + optionsHeaders + "\n" + optionsSample
}
