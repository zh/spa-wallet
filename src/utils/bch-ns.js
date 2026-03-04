// src/utils/bch-ns.js
// BCH Name Service (BCH-NS) - Decentralized wallet name resolution

const LOKAD_PREFIX = '42434e53' // hex for "BCNS"
// const BURN_ADDRESS = 'bitcoincash:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqu08dsyxz98whc'
const BURN_ADDRESS = 'bitcoincash:qqu62lcjqftsn42sj8tdzl5yg4deryz4us245mqz37'
const BURN_AMOUNT_SATS = 10000
const PROTOCOL_VERSION = 1

// Configurable resolver URL - change this to point to your indexer
// const RESOLVER_URL = 'https://bchns.example.com'
const RESOLVER_URL = import.meta.env.VITE_RESOLVER_URL || 'http://127.0.0.1:3100'

// Mock data for development/testing when RESOLVER_URL is a placeholder
const MOCK_NAMES = {
  'stoyan.bch': { address: 'bitcoincash:qqu62lcjqftsn42sj8tdzl5yg4deryz4us245mqz37', owner: 'bitcoincash:qqu62lcjqftsn42sj8tdzl5yg4deryz4us245mqz37', txid: 'mock', blockHeight: 0 },
  'test.bch': { address: 'bitcoincash:qpp0f8t557llskht7nhxpjwk33mnptjnfuw6cv3zvs', owner: 'bitcoincash:qpp0f8t557llskht7nhxpjwk33mnptjnfuw6cv3zvs', txid: 'mock', blockHeight: 0 }
}

const NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]\.bch$/

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
    const asm = vout.scriptPubKey?.asm || ''
    if (!asm.startsWith('OP_RETURN')) continue

    // Decode the OP_RETURN hex chunks
    const parts = asm.split(' ').slice(1) // skip "OP_RETURN"
    if (parts.length < 2) continue

    // First chunk should be our LOKAD prefix
    const prefix = parts[0]
    if (prefix !== LOKAD_PREFIX) continue

    // Second chunk is the UTF-8 JSON payload
    const payloadHex = parts[1]
    const bytes = payloadHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
    const payloadStr = new TextDecoder().decode(new Uint8Array(bytes))
    const payload = JSON.parse(payloadStr)

    if (payload.addr === expectedAddr) return true
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

  // Mock mode: return hardcoded data when resolver is a placeholder
  const isMock = RESOLVER_URL.includes('example.com')
  if (isMock) {
    const entry = MOCK_NAMES[normalized]
    if (!entry) throw new Error(`Name not found: ${normalized}`)
    return entry
  }

  const nameWithoutTld = normalized.replace(/\.bch$/, '')
  const url = `${RESOLVER_URL}/api/name/${encodeURIComponent(nameWithoutTld)}`
  const response = await fetch(url)

  if (response.status === 404) {
    throw new Error(`Name not found: ${normalized}`)
  }
  if (!response.ok) {
    throw new Error(`Resolver error: ${response.status}`)
  }

  const data = await response.json()

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

export {
  LOKAD_PREFIX,
  BURN_ADDRESS,
  BURN_AMOUNT_SATS,
  RESOLVER_URL,
  NAME_REGEX
}
