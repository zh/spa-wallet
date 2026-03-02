import { useEffect, useRef } from 'react'

/**
 * Simple polling hook for balance updates.
 * Pauses when tab is hidden or browser is offline, resumes on return.
 */
export const useBalancePoller = (wallet, onUpdate, interval = 10000) => {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!wallet) return

    const poll = async () => {
      if (document.hidden || !navigator.onLine) return
      try {
        const result = await wallet.getBalance()
        onUpdate(result)
      } catch (err) {
        console.warn('Balance poll failed:', err.message || err)
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
    const handleOnline = () => (navigator.onLine ? start() : stop())

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
  }, [wallet, onUpdate, interval])
}
