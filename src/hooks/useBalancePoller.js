import { useEffect, useRef, useCallback } from 'react'

const MAX_BACKOFF_MS = 60000
const STALE_THRESHOLD = 3

export const useBalancePoller = (wallet, onUpdate, interval = 10000, onError = null) => {
  const intervalRef = useRef(null)
  const onUpdateRef = useRef(onUpdate)
  const onErrorRef = useRef(onError)
  const failCountRef = useRef(0)

  onUpdateRef.current = onUpdate
  onErrorRef.current = onError

  const getBackoffInterval = useCallback(() => {
    if (failCountRef.current === 0) return interval
    return Math.min(interval * Math.pow(2, failCountRef.current), MAX_BACKOFF_MS)
  }, [interval])

  useEffect(() => {
    if (!wallet) return

    const schedule = (delay) => {
      stop()
      intervalRef.current = setInterval(poll, delay)
    }

    const poll = async () => {
      if (document.hidden || !navigator.onLine) return
      try {
        const result = await wallet.getBalance()
        failCountRef.current = 0
        onUpdateRef.current(result)
      } catch (err) {
        failCountRef.current++
        console.warn('Balance poll failed:', err.message || err)
        if (onErrorRef.current) {
          onErrorRef.current(failCountRef.current)
        }
        if (failCountRef.current >= STALE_THRESHOLD) {
          schedule(getBackoffInterval())
        }
      }
    }

    const start = () => {
      if (intervalRef.current) return
      poll()
      intervalRef.current = setInterval(poll, interval)
    }

    const stop = () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const handleVisibility = () => (document.hidden ? stop() : start())
    const handleOnline = () => {
      if (navigator.onLine) {
        failCountRef.current = 0
        start()
      } else {
        stop()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOnline)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOnline)
    }
  }, [wallet, interval, getBackoffInterval])
}
