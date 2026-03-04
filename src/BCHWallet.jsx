import { useState, useEffect, useCallback, useRef } from 'react'
import { handleError } from './utils/errorHandler'
import { useBalancePoller } from './hooks/useBalancePoller'
import { useCopyFeedback } from './hooks/useCopyFeedback'
import ServerSelector from './components/ServerSelector'
import AddressDisplay from './components/AddressDisplay'
import SendForm from './components/SendForm'
import WalletInfo from './components/WalletInfo'

const BchWallet = window.SlpWallet?.default || window.SlpWallet

const SATS_PER_BCH = 100000000

const SERVERS = [
  { label: 'FullStack.cash (Free)', interface: 'consumer-api', restURL: 'https://free-bch.fullstack.cash' },
  { label: 'BCH Consumer (Free)', interface: 'consumer-api', restURL: 'https://dev-consumer.psfoundation.info' },
  { label: 'Local Dev', interface: 'rest-api', restURL: 'http://bch_server:5942/v6' }
]

const DEFAULT_SERVER = SERVERS[0]
const STORAGE_KEY_SERVER = 'BCH_SERVER'

const BCHWallet = () => {
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState(null)
  const [initError, setInitError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [balanceStale, setBalanceStale] = useState(false)
  const [serverConfig, setServerConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER)
    return saved ? JSON.parse(saved) : DEFAULT_SERVER
  })
  const [connecting, setConnecting] = useState(false)
  const [mnemonicInput, setMnemonicInput] = useState(
    () => localStorage.getItem('BCH_MNEMONIC') || ''
  )
  const { message: copyMsg, copy } = useCopyFeedback()
  const initialServerRef = useRef(serverConfig)

  const cashAddress = wallet?.walletInfo?.cashAddress

  const connectWallet = async (config) => {
    const storedMnemonic = localStorage.getItem('BCH_MNEMONIC')
    const bchWallet = new BchWallet(storedMnemonic || undefined, {
      interface: config.interface,
      restURL: config.restURL
    })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()
    if (!storedMnemonic) {
      localStorage.setItem('BCH_MNEMONIC', bchWallet.walletInfo.mnemonic)
      setMnemonicInput(bchWallet.walletInfo.mnemonic)
    }
    setWallet(bchWallet)
    bchWallet.getBalance().then(setBalance)
  }

  useEffect(() => {
    connectWallet(initialServerRef.current).catch(err => {
      const { message } = handleError(err, 'init')
      setInitError(message)
    })
  }, [])

  const handlePollerError = useCallback((failCount) => {
    setBalanceStale(failCount >= 3)
  }, [])

  useBalancePoller(wallet, setBalance, 10000, handlePollerError)

  const handleConnect = async () => {
    setConnecting(true)
    setInitError(null)
    setBalance(null)
    setWallet(null)
    setBalanceStale(false)
    try {
      await connectWallet(serverConfig)
      localStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(serverConfig))
    } catch (err) {
      const { message } = handleError(err, 'init')
      setInitError(message)
    } finally {
      setConnecting(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setBalanceStale(false)
    wallet.getBalance()
      .then(setBalance)
      .finally(() => setRefreshing(false))
  }

  const handleSaveMnemonic = async () => {
    const trimmed = mnemonicInput.trim()
    if (!trimmed) return
    localStorage.setItem('BCH_MNEMONIC', trimmed)
    await handleConnect()
  }

  const handleResetMnemonic = async () => {
    if (!window.confirm('This will discard the current mnemonic and generate a new wallet. Continue?')) return
    localStorage.removeItem('BCH_MNEMONIC')
    setMnemonicInput('')
    await handleConnect()
  }

  return (
    <div className='wallet-container'>
      <ServerSelector
        servers={SERVERS}
        serverConfig={serverConfig}
        onServerChange={setServerConfig}
        onConnect={handleConnect}
        connecting={connecting}
      />
      {initError && <div className='tx-error'>{initError}</div>}
      {!wallet || !cashAddress
        ? (connecting ? null : <div className='container'>Loading...</div>)
        : (
          <>
            <div className='container balance-container'>
              <p>{parseFloat((balance / SATS_PER_BCH).toFixed(8))} BCH</p>
              {balanceStale && (
                <div className='balance-stale'>Balance may be outdated. Check your connection.</div>
              )}
              <button className='refresh-button' onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <AddressDisplay cashAddress={cashAddress} copyMsg={copyMsg} onCopy={copy} />
            {balance > 0 && <SendForm wallet={wallet} />}
            <WalletInfo
              wallet={wallet}
              mnemonicInput={mnemonicInput}
              onMnemonicChange={setMnemonicInput}
              onSaveMnemonic={handleSaveMnemonic}
              onResetMnemonic={handleResetMnemonic}
              onCopy={copy}
            />
          </>
        )}
    </div>
  )
}

export default BCHWallet
