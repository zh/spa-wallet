// src/utils/errorHandler.js

/**
 * Categorize errors and return user-friendly messages.
 * Keeps original message for debugging in dev console.
 */
export const handleError = (error, context = '') => {
  const originalMessage = error?.message || error?.toString() || 'An error occurred'
  const lower = originalMessage.toLowerCase()

  let message = 'An unexpected error occurred. Please try again.'

  if (['network error', 'timeout', 'fetch failed', 'enotfound', 'econnrefused'].some(k => lower.includes(k))) {
    message = 'Network connection error. Please check your internet connection and try again.'
  } else if (lower.includes('insufficient')) {
    message = 'Insufficient funds for this transaction.'
  } else if (lower.includes('mnemonic')) {
    message = 'Invalid recovery phrase. Please check and try again.'
  } else if (lower.includes('not initialized')) {
    message = 'Wallet not properly initialized. Please reconnect your wallet.'
  } else if (lower.includes('invalid address') || lower.includes('invalid recipient')) {
    message = 'Invalid address format. Please verify the address.'
  } else if (lower.includes('invalid amount')) {
    message = 'Invalid amount. Please enter a valid number.'
  } else if (lower.includes('rate limit') || lower.includes('429')) {
    message = 'Too many requests. Please wait a moment and try again.'
  } else if (lower.includes('503') || lower.includes('502')) {
    message = 'Service temporarily unavailable. Please try again later.'
  } else if (['401', '403', '500', '504'].some(k => lower.includes(k))) {
    message = 'Server error. Please try again later.'
  }

  if (import.meta?.env?.DEV) {
    console.warn(`[${context}]`, originalMessage)
  }

  return { message, originalMessage, context }
}
