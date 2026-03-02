/* global localStorage */
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { isValidBCHAddress, isValidAmount } from './utils/validation'
import { handleError } from './utils/errorHandler'
import { useBalancePoller } from './hooks/useBalancePoller'
import { useCopyFeedback } from './hooks/useCopyFeedback'

const BchWallet = window.SlpWallet?.default || window.SlpWallet

const SATS_PER_BCH = 100000000
const DUST_LIMIT = 0.00000546

const BCH_CONFIG = {
  interface: 'rest-api',
  restURL: 'http://192.168.0.17:5942/v6'
}

const shortify = (address) => {
  const parts = address.split(':')
  const addr = parts.length > 1 ? parts[1] : parts[0]
  return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`
}

const BCHWallet = () => {
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState(null)
  const [initError, setInitError] = useState(null)
  const [sendForm, setSendForm] = useState({ recipient: '', amount: 0 })
  const [sendStatus, setSendStatus] = useState({ isSending: false, txId: null, error: null })
  const { message: copyMsg, copy } = useCopyFeedback()

  const cashAddress = wallet?.walletInfo?.cashAddress

  useEffect(() => {
    const initWallet = async () => {
      const storedMnemonic = localStorage.getItem('BCH_MNEMONIC')
      const bchWallet = new BchWallet(storedMnemonic || undefined, BCH_CONFIG)

      await bchWallet.walletInfoPromise
      await bchWallet.initialize()

      if (!storedMnemonic) {
        localStorage.setItem('BCH_MNEMONIC', bchWallet.walletInfo.mnemonic)
      }

      setWallet(bchWallet)
      bchWallet.getBalance().then(setBalance)
    }

    initWallet().catch(err => {
      const { message } = handleError(err, 'init')
      setInitError(message)
    })
  }, [])

  useBalancePoller(wallet, setBalance, 10000)

  const handleRefresh = () => {
    setSendStatus({ isSending: false, txId: null, error: null })
    wallet.getBalance().then(setBalance)
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

      setSendForm({ recipient: '', amount: 0 })
      setSendStatus({ isSending: false, txId: result, error: null })
      setBalance(await wallet.getBalance())
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, txId: null }))
      }, 20000)
    } catch (err) {
      const { message } = handleError(err, 'send_transaction')
      setSendStatus({ isSending: false, txId: null, error: message })
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, error: null }))
      }, 5000)
    }
  }

  const renderMsg = () => {
    let className = 'qr-code-instruction'
    if (copyMsg === 'Copied!') className += ' copy-msg-success'
    else if (copyMsg.startsWith('Failed')) className += ' copy-msg-error'
    return <div className={className}>{copyMsg}</div>
  }

  const renderAddress = () => (
    <div className='container address-container'>
      <div className='qr-code'>
        <QRCodeSVG
          value={cashAddress}
          size={128}
          onClick={() => copy(cashAddress)}
        />
      </div>
      {renderMsg()}
      <div className='address wallet-address-long'>{cashAddress}</div>
      <div className='address wallet-address-short'>{shortify(cashAddress)}</div>
    </div>
  )

  const renderBalance = () => (
    <div className='container balance-container'>
      <p><strong>Balance</strong> {(balance / SATS_PER_BCH).toFixed(8)} BCH</p>
    </div>
  )

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

  const renderMnemonic = () => {
    const storedMnemonic = localStorage.getItem('BCH_MNEMONIC')
    return (
      <div className='container mnemonic-container'>
        <button
          className='toggle-details-button'
          onClick={() => setShowMnemonic(!showMnemonic)}
        >
          {showMnemonic ? 'Hide' : 'Show'} Mnemonic
        </button>
        {showMnemonic && (
          <span
            className='qr-code-instruction mnemonic-text'
            onClick={() => copy(storedMnemonic || '')}
          >
            {storedMnemonic || ''}
          </span>
        )}
      </div>
    )
  }

  if (initError) {
    return (
      <div className='wallet-container'>
        <div className='tx-error'>{initError}</div>
      </div>
    )
  }

  if (!wallet || !cashAddress) {
    return (
      <div className='wallet-container'>
        Loading...
      </div>
    )
  }

  return (
    <div className='wallet-container'>
      <h3>BCH wallet <button className='refresh-button' onClick={handleRefresh}>Refresh</button></h3>
      {renderAddress()}
      {renderBalance()}
      {balance > 0 && (
        <>
          <h3>Send BCH</h3>
          {renderSend()}
        </>
      )}
      {renderMnemonic()}
    </div>
  )
}

export default BCHWallet
