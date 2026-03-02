// src/utils/validation.js

/**
 * Validate BCH address format (cashaddr or legacy)
 */
export const isValidBCHAddress = (address) => {
  if (!address || typeof address !== 'string') return false

  const trimmed = address.trim()
  const cashAddressRegex = /^bitcoincash:[a-z0-9]{42,62}$/
  const legacyAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/

  return cashAddressRegex.test(trimmed) || legacyAddressRegex.test(trimmed)
}

/**
 * Validate BCH amount (positive, max 8 decimals, within supply limit)
 */
export const isValidAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') return false

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) return false

  return numAmount <= 21000000 && /^\d+\.?\d{0,8}$/.test(amount.toString())
}
