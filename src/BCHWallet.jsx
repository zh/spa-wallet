import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { isValidBCHAddress, isValidAmount } from './utils/validation'
import { handleError } from './utils/errorHandler'
import { useBalancePoller } from './hooks/useBalancePoller'
import { useCopyFeedback } from './hooks/useCopyFeedback'

const BchWallet = window.SlpWallet?.default || window.SlpWallet

const SATS_PER_BCH = 100000000
const DUST_LIMIT = 0.00000546

const SERVERS = [
  { label: 'FullStack.cash (Free)', interface: 'consumer-api', restURL: 'https://free-bch.fullstack.cash' },
  { label: 'BCH Consumer (Free)', interface: 'consumer-api', restURL: 'https://dev-consumer.psfoundation.info' },
  { label: 'Local Dev', interface: 'rest-api', restURL: 'http://bch_server:5942/v6' }
]

const DEFAULT_SERVER = SERVERS[0]
const STORAGE_KEY_SERVER = 'BCH_SERVER'

const shortify = (address) => {
  const parts = address.split(':')
  const addr = parts.length > 1 ? parts[1] : parts[0]
  return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`
}

const BCHWallet = () => {
  const [showInfo, setShowInfo] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState(null)
  const [initError, setInitError] = useState(null)
  const [sendForm, setSendForm] = useState({ recipient: '', amount: '' })
  const [sendStatus, setSendStatus] = useState({ isSending: false, txId: null, error: null })
  const [refreshing, setRefreshing] = useState(false)
  const [serverConfig, setServerConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER)
    return saved ? JSON.parse(saved) : DEFAULT_SERVER
  })
  const [connecting, setConnecting] = useState(false)
  const [mnemonicInput, setMnemonicInput] = useState(
    () => localStorage.getItem('BCH_MNEMONIC') || ''
  )
  const { message: copyMsg, copy } = useCopyFeedback()

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
    connectWallet(serverConfig).catch(err => {
      const { message } = handleError(err, 'init')
      setInitError(message)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useBalancePoller(wallet, setBalance, 10000)

  const handleConnect = async () => {
    setConnecting(true)
    setInitError(null)
    setBalance(null)
    setWallet(null)
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
    setSendStatus({ isSending: false, txId: null, error: null })
    setRefreshing(true)
    wallet.getBalance()
      .then(setBalance)
      .finally(() => setRefreshing(false))
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSendStatus({ isSending: true, txId: null, error: null })

    try {
      const recipient = sendForm.recipient.trim()
      const amount = sendForm.amount.toString().trim()

      if (!isValidBCHAddress(recipient)) {
        throw new Error('Invalid recipient address format')
      }

      if (!isValidAmount(amount)) {
        throw new Error('Invalid amount. Please enter a valid number')
      }

      const numAmount = parseFloat(amount)
      if (numAmount < DUST_LIMIT) {
        throw new Error('Amount too small. Minimum is 546 satoshis')
      }

      const receivers = [{
        address: recipient,
        amountSat: Math.floor(numAmount * SATS_PER_BCH)
      }]

      const result = await wallet.send(receivers)

      setSendForm({ recipient: '', amount: '' })
      setSendStatus({ isSending: false, txId: result, error: null })
      setBalance(await wallet.getBalance())
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, txId: null }))
      }, 10000)
    } catch (err) {
      const { message } = handleError(err, 'send_transaction')
      setSendStatus({ isSending: false, txId: null, error: message })
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, error: null }))
      }, 5000)
    }
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

  const renderServer = () => (
    <div className='container server-container'>
      <select
        className='server-select'
        value={serverConfig.restURL}
        onChange={(e) => {
          const server = SERVERS.find(s => s.restURL === e.target.value)
          setServerConfig(server)
        }}
      >
        {SERVERS.map(s => (
          <option key={s.restURL} value={s.restURL}>{s.label}</option>
        ))}
      </select>
      <button
        className='connect-button'
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect'}
      </button>
    </div>
  )

  const renderAddress = () => {
    const isFeedback = copyMsg === 'Copied!' || copyMsg.startsWith('Failed')
    const feedbackClass = copyMsg === 'Copied!'
      ? 'address copy-msg-success'
      : copyMsg.startsWith('Failed')
        ? 'address copy-msg-error'
        : 'address'
    return (
      <div className='container address-container'>
        <div className='qr-code' onClick={() => copy(cashAddress)}>
          <QRCodeSVG value={cashAddress} size={128} />
        </div>
        <div className={feedbackClass} onClick={() => copy(cashAddress)} style={{ cursor: 'pointer' }}>
          {isFeedback ? copyMsg : shortify(cashAddress)}
        </div>
      </div>
    )
  }

  const renderSend = () => (
    <div className='container sendbch-container'>
      <form onSubmit={handleSend}>
        <div className='send-group'>
          <input
            type='text'
            className='form-input'
            placeholder='Recipient Address'
            value={sendForm.recipient}
            onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
            required
          />
          <input
            type='number'
            className='form-input'
            step='0.00000001'
            placeholder='Amount (BCH)'
            value={sendForm.amount}
            onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
            required
          />
          <button
            className='send-button'
            type='submit'
            disabled={sendStatus.isSending || !sendForm.recipient.trim()}
          >
            {sendStatus.isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {sendStatus.txId && (
          <div className='tx-success'>
            {'Transaction ID: '}
            <a
              href={`https://bch.loping.net/tx/${sendStatus.txId}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {sendStatus.txId.slice(0, 20)}...
            </a>
          </div>
        )}
        {sendStatus.error && <div className='tx-error'>{sendStatus.error}</div>}
      </form>
    </div>
  )

  const renderInfo = () => {
    const legacyAddress = wallet?.walletInfo?.legacyAddress || ''
    const privateKey = wallet?.walletInfo?.privateKey || ''
    const hdPath = wallet?.walletInfo?.hdPath || "m/44'/245'/0'/0/0"
    return (
      <div className='container mnemonic-container'>
        <button
          className='toggle-details-button'
          onClick={() => setShowInfo(!showInfo)}
        >
          {showInfo ? 'Hide Info' : 'Info'}
        </button>
        {showInfo && (
          <div className='info-details'>
            <div className='info-row' onClick={() => copy(cashAddress)}>
              <b>Address:</b> {cashAddress}
            </div>
            <div className='info-row' onClick={() => copy(legacyAddress)}>
              <b>Legacy:</b> {legacyAddress}
            </div>
            <div className='info-row' onClick={() => copy(privateKey)}>
              <b>Private Key:</b> {privateKey}
            </div>
            <div className='info-row' onClick={() => copy(hdPath)}>
              <b>HD Path:</b> {hdPath}
            </div>
            <div className='mnemonic-edit'>
              <b>Mnemonic:</b>
              <textarea
                className='mnemonic-input'
                rows={2}
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
              />
              <div className='mnemonic-actions'>
                <button type='button' onClick={handleSaveMnemonic}>Save</button>
                <button type='button' className='reset-button' onClick={handleResetMnemonic}>Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='wallet-container'>
      {renderServer()}
      {initError && <div className='tx-error'>{initError}</div>}
      {!wallet || !cashAddress
        ? (
            connecting ? null : <div className='container'>Loading...</div>
          )
        : (
          <>
            <div className='container balance-container'>
              <p>{parseFloat((balance / SATS_PER_BCH).toFixed(8))} BCH</p>
              <button className='refresh-button' onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {renderAddress()}
            {balance > 0 && renderSend()}
            {renderInfo()}
          </>
          )}
    </div>
  )
}

export default BCHWallet
