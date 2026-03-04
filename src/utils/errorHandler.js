// src/utils/errorHandler.js

const ERROR_CATEGORIES = [
  {
    code: 'NETWORK',
    patterns: ['network error', 'timeout', 'fetch failed', 'enotfound', 'econnrefused', 'timed out', 'aborted'],
    message: 'Network connection error. Check your internet connection and try again.'
  },
  {
    code: 'INSUFFICIENT_FUNDS',
    patterns: ['insufficient'],
    message: 'Insufficient funds for this transaction.'
  },
  {
    code: 'INVALID_MNEMONIC',
    patterns: ['mnemonic'],
    message: 'Invalid recovery phrase. Please check and try again.'
  },
  {
    code: 'NOT_INITIALIZED',
    patterns: ['not initialized'],
    message: 'Wallet not properly initialized. Try reconnecting.'
  },
  {
    code: 'INVALID_ADDRESS',
    patterns: ['invalid address', 'invalid recipient', 'resolved address'],
    message: 'Invalid address format. Please verify the address.'
  },
  {
    code: 'INVALID_AMOUNT',
    patterns: ['invalid amount'],
    message: 'Invalid amount. Please enter a valid number.'
  },
  {
    code: 'RATE_LIMIT',
    patterns: ['rate limit', '429'],
    message: 'Too many requests. Please wait a moment and try again.'
  },
  {
    code: 'SERVICE_UNAVAILABLE',
    patterns: ['503', '502'],
    message: 'Service temporarily unavailable. Please try again later.'
  },
  {
    code: 'SERVER_ERROR',
    patterns: ['401', '403', '500', '504'],
    message: 'Server error. Please try again later.'
  }
]

export const handleError = (error, context = '') => {
  const originalMessage = error?.message || error?.toString() || 'An error occurred'
  const lower = originalMessage.toLowerCase()

  let code = 'UNKNOWN'
  let message = 'An unexpected error occurred. Please try again.'

  for (const category of ERROR_CATEGORIES) {
    if (category.patterns.some(p => lower.includes(p))) {
      code = category.code
      message = category.message
      break
    }
  }

  if (import.meta?.env?.DEV) {
    console.warn(`[${context}]`, originalMessage)
  }

  return { code, message, originalMessage, context }
}
