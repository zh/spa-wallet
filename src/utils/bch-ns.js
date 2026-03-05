// src/utils/bch-ns.js
// BCH Name Service (BCH-NS) - Decentralized wallet name resolution

const LOKAD_PREFIX = '42434e53' // hex for "BCNS"
const BURN_ADDRESS = 'bitcoincash:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqu08dsyxz98whc'
const BURN_AMOUNT_SATS = 10000
const PROTOCOL_VERSION = 1

const RESOLVER_URL = import.meta.env.VITE_RESOLVER_URL || 'http://127.0.0.1:3100'
const TLD = import.meta.env.VITE_RESOLVER_TLD || 'bch'

const NAME_REGEX = new RegExp('^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]\\.' + TLD + '$')

const RESOLVE_TIMEOUT_MS = 5000

/**
 * Detect if input is a name (vs a regular address)
 */
export const isBchName = (input) => {
  if (!input || typeof input !== 'string') return false
  return input.trim().toLowerCase().endsWith('.' + TLD)
}

/**
 * Validate name format: 3-32 chars before TLD, alphanumeric + hyphens, lowercase
 */
export const isValidBchName = (name) => {
  if (!name || typeof name !== 'string') return false
  const normalized = name.trim().toLowerCase()
  return NAME_REGEX.test(normalized)
}

/**
 * Verify a resolution by fetching the TX from blockchain and parsing OP_RETURN
 * Returns true if the OP_RETURN payload address matches expectedAddr
 */
export const verifyResolution = async (wallet, txid, expectedAddr) => {
  const txResults = await wallet.getTxData([txid])
  const txData = txResults[0]

  for (const vout of txData.vout) {
    const hex = vout.scriptPubKey?.hex || ''
    // Must start with OP_RETURN (6a) + push4 (04) + LOKAD "BCNS" (42434e53)
    if (!hex.startsWith('6a04' + LOKAD_PREFIX)) continue

    // Skip first 12 hex chars (6 bytes: 6a + 04 + 4-byte prefix)
    const remaining = hex.slice(12)

    // Read push opcode for the JSON payload
    const pushByte = parseInt(remaining.slice(0, 2), 16)
    let payloadHex
    if (pushByte <= 0x4b) {
      payloadHex = remaining.slice(2, 2 + pushByte * 2)
    } else if (pushByte === 0x4c) {
      const len = parseInt(remaining.slice(2, 4), 16)
      payloadHex = remaining.slice(4, 4 + len * 2)
    } else if (pushByte === 0x4d) {
      const lo = parseInt(remaining.slice(2, 4), 16)
      const hi = parseInt(remaining.slice(4, 6), 16)
      const len = lo + hi * 256
      payloadHex = remaining.slice(6, 6 + len * 2)
    } else {
      continue
    }

    try {
      const bytes = payloadHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
      const payloadStr = new TextDecoder().decode(new Uint8Array(bytes))
      const payload = JSON.parse(payloadStr)
      if (payload.addr === expectedAddr) return true
    } catch {
      continue
    }
  }

  return false
}

/**
 * Resolve a name to an address via the indexer, then verify on-chain
 * Returns { address, owner, txid, blockHeight } or throws
 */
export const resolveName = async (name, wallet = null) => {
  const normalized = name.trim().toLowerCase()
  if (!isValidBchName(normalized)) {
    throw new Error(`Invalid BCH name: ${normalized}`)
  }

  const nameWithoutTld = normalized.replace('.' + TLD, '')
  const url = `${RESOLVER_URL}/api/name/${encodeURIComponent(nameWithoutTld)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Name resolution timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  if (response.status === 404) {
    throw new Error(`Name not found: ${normalized}`)
  }
  if (!response.ok) {
    throw new Error(`Resolver error: ${response.status}`)
  }

  const data = await response.json()

  // Validate resolver response shape
  if (!data.address || typeof data.address !== 'string') {
    throw new Error('Invalid resolver response: missing address')
  }

  // Wallet-side verification: confirm indexer response matches on-chain data
  if (wallet && data.txid && data.txid !== 'mock') {
    try {
      const verified = await verifyResolution(wallet, data.txid, data.address)
      if (!verified) {
        console.warn('BCH-NS: on-chain verification mismatch for', name)
      }
    } catch (err) {
      console.warn('BCH-NS: on-chain verification unavailable:', err.message)
    }
  }

  return data
}

/**
 * Build the OP_RETURN JSON payload for a name operation
 */
const buildPayload = (op, name, extra = {}) => {
  const normalized = name.trim().toLowerCase()
  return JSON.stringify({ op, name: normalized, ...extra, v: PROTOCOL_VERSION })
}

/**
 * Register a new name (Create). Includes burn output for anti-squatting.
 */
export const createName = async (wallet, name, addr) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('C', name, { addr })
  const burnOutput = [{ address: BURN_ADDRESS, amountSat: BURN_AMOUNT_SATS }]

  return wallet.sendOpReturn(msg, LOKAD_PREFIX, burnOutput)
}

/**
 * Update the address for an existing name (owner only)
 */
export const updateName = async (wallet, name, addr) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('U', name, { addr })
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}

/**
 * Delete a name (owner only). 100-block cooldown before re-registration.
 */
export const deleteName = async (wallet, name) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('D', name)
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}

/**
 * Transfer ownership of a name to another address
 */
export { TLD }

export const transferName = async (wallet, name, to) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('T', name, { to })
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}
