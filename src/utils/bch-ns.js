// src/utils/bch-ns.js
// BCH Name Service (BCH-NS) - Decentralized wallet name resolution

const LOKAD_PREFIX = '42434e53' // hex for "BCNS"
const BURN_ADDRESS = 'bitcoincash:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqu08dsyxz98whc'
const BURN_AMOUNT_SATS = 10000
const PROTOCOL_VERSION = 1

const RESOLVER_URL = import.meta.env.VITE_RESOLVER_URL || 'http://127.0.0.1:3100'

const NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]\.bch$/

const RESOLVE_TIMEOUT_MS = 5000

/**
 * Detect if input is a .bch name (vs a regular address)
 */
export const isBchName = (input) => {
  if (!input || typeof input !== 'string') return false
  return input.trim().toLowerCase().endsWith('.bch')
}

/**
 * Validate .bch name format: 3-32 chars before .bch, alphanumeric + hyphens, lowercase
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
export const verifyResolution = async (bchjs, txid, expectedAddr) => {
  const txData = await bchjs.RawTransactions.getRawTransaction(txid, true)

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
 * Resolve a .bch name to an address via the indexer, then verify on-chain
 * Returns { address, owner, txid, blockHeight } or throws
 */
export const resolveName = async (name, bchjs = null) => {
  const normalized = name.trim().toLowerCase()
  if (!isValidBchName(normalized)) {
    throw new Error(`Invalid BCH name: ${normalized}`)
  }

  // Mock mode: only in development builds
  if (import.meta.env.DEV) {
    const MOCK_NAMES = {
      'stoyan.bch': { address: 'bitcoincash:qqu62lcjqftsn42sj8tdzl5yg4deryz4us245mqz37', owner: 'bitcoincash:qqu62lcjqftsn42sj8tdzl5yg4deryz4us245mqz37', txid: 'mock', blockHeight: 0 },
      'test.bch': { address: 'bitcoincash:qpp0f8t557llskht7nhxpjwk33mnptjnfuw6cv3zvs', owner: 'bitcoincash:qpp0f8t557llskht7nhxpjwk33mnptjnfuw6cv3zvs', txid: 'mock', blockHeight: 0 }
    }
    const mockEntry = MOCK_NAMES[normalized]
    if (mockEntry) return mockEntry
  }

  const nameWithoutTld = normalized.replace(/\.bch$/, '')
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
  if (bchjs && data.txid && data.txid !== 'mock') {
    const verified = await verifyResolution(bchjs, data.txid, data.address)
    if (!verified) {
      throw new Error('Resolution verification failed: on-chain data does not match indexer')
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
 * Register a new .bch name (Create). Includes burn output for anti-squatting.
 */
export const createName = async (wallet, name, addr) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('C', name, { addr })
  const burnOutput = [{ address: BURN_ADDRESS, amountSat: BURN_AMOUNT_SATS }]

  return wallet.sendOpReturn(msg, LOKAD_PREFIX, burnOutput)
}

/**
 * Update the address for an existing .bch name (owner only)
 */
export const updateName = async (wallet, name, addr) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('U', name, { addr })
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}

/**
 * Delete a .bch name (owner only). 100-block cooldown before re-registration.
 */
export const deleteName = async (wallet, name) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('D', name)
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}

/**
 * Transfer ownership of a .bch name to another address
 */
export const transferName = async (wallet, name, to) => {
  if (!isValidBchName(name)) throw new Error(`Invalid BCH name: ${name}`)

  const msg = buildPayload('T', name, { to })
  return wallet.sendOpReturn(msg, LOKAD_PREFIX)
}
