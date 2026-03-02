import { useState, useRef, useEffect } from 'react'

const DEFAULT_MSG = 'Click QR to copy address'

export const useCopyFeedback = (resetDelay = 1000) => {
  const [message, setMessage] = useState(DEFAULT_MSG)
  const timeoutRef = useRef(null)

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Copied!')
    } catch {
      setMessage('Failed to copy')
    }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setMessage(DEFAULT_MSG), resetDelay)
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return { message, copy }
}
