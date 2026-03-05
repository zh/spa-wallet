import { useState, useEffect, useRef } from 'react'
import { isValidBCHAddress, isValidAmount, isValidRecipient } from '../utils/validation'
import { isBchName, resolveName, TLD } from '../utils/bch-ns'
import { handleError } from '../utils/errorHandler'

const SATS_PER_BCH = 100000000
const DUST_LIMIT = 0.00000546
const DEBOUNCE_MS = 500

const SendForm = ({ wallet }) => {
  const [sendForm, setSendForm] = useState({ recipient: '', amount: '' })
  const [sendStatus, setSendStatus] = useState({ isSending: false, txId: null, error: null })
  const [resolvedAddr, setResolvedAddr] = useState({ address: null, resolving: false, error: null })
  const [confirming, setConfirming] = useState(null)
  const debounceRef = useRef(null)

  // Debounced .bch name resolution
  useEffect(() => {
    const input = sendForm.recipient.trim()
    if (!isBchName(input)) {
      setResolvedAddr({ address: null, resolving: false, error: null })
      return
    }

    setResolvedAddr(prev => ({ ...prev, resolving: true, error: null }))
    clearTimeout(debounceRef.current)

    let cancelled = false
    debounceRef.current = setTimeout(() => {
      resolveName(input, wallet)
        .then((data) => {
          if (!cancelled) setResolvedAddr({ address: data.address, resolving: false, error: null })
        })
        .catch((err) => {
          if (!cancelled) setResolvedAddr({ address: null, resolving: false, error: err.message })
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(debounceRef.current)
    }
  }, [sendForm.recipient, wallet])

  const buildTransaction = async () => {
    const recipientInput = sendForm.recipient.trim()
    const amount = sendForm.amount.toString().trim()

    if (!isValidRecipient(recipientInput)) {
      throw new Error('Invalid recipient address or name')
    }

    let recipient = recipientInput
    if (isBchName(recipientInput)) {
      if (resolvedAddr.address) {
        recipient = resolvedAddr.address
      } else {
        const data = await resolveName(recipientInput, wallet)
        recipient = data.address
      }
    }

    if (!isValidBCHAddress(recipient)) {
      throw new Error('Resolved address is invalid')
    }

    if (!isValidAmount(amount)) {
      throw new Error('Invalid amount. Please enter a valid number')
    }

    const numAmount = parseFloat(amount)
    if (numAmount < DUST_LIMIT) {
      throw new Error('Amount too small. Minimum is 546 satoshis')
    }

    return {
      address: recipient,
      amountSat: Math.floor(numAmount * SATS_PER_BCH),
      amountBch: numAmount
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSendStatus({ isSending: false, txId: null, error: null })

    try {
      const tx = await buildTransaction()
      setConfirming(tx)
    } catch (err) {
      const { message } = handleError(err, 'send_validation')
      setSendStatus({ isSending: false, txId: null, error: message })
      setTimeout(() => setSendStatus(prev => ({ ...prev, error: null })), 5000)
    }
  }

  const handleConfirmSend = async () => {
    const tx = confirming
    setConfirming(null)
    setSendStatus({ isSending: true, txId: null, error: null })

    try {
      const receivers = [{ address: tx.address, amountSat: tx.amountSat }]
      const result = await wallet.send(receivers)

      setSendForm({ recipient: '', amount: '' })
      setSendStatus({ isSending: false, txId: result, error: null })
      setTimeout(() => setSendStatus(prev => ({ ...prev, txId: null })), 10000)
    } catch (err) {
      const { message } = handleError(err, 'send_transaction')
      setSendStatus({ isSending: false, txId: null, error: message })
      setTimeout(() => setSendStatus(prev => ({ ...prev, error: null })), 5000)
    }
  }

  const handleCancelSend = () => setConfirming(null)

  return (
    <div className='container sendbch-container'>
      <form onSubmit={handleSubmit}>
        <div className='send-group'>
          <input
            type='text'
            className='form-input'
            placeholder={`Address or name (e.g. stoyan.${TLD})`}
            value={sendForm.recipient}
            onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
            required
          />
          {resolvedAddr.resolving && (
            <div className='bchns-resolving'>Resolving name...</div>
          )}
          {resolvedAddr.address && (
            <div className='bchns-resolved'>{resolvedAddr.address}</div>
          )}
          {resolvedAddr.error && (
            <div className='bchns-error'>{resolvedAddr.error}</div>
          )}
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
            disabled={sendStatus.isSending || !sendForm.recipient.trim() || resolvedAddr.resolving}
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

      {confirming && (
        <div className='confirm-overlay'>
          <div className='confirm-dialog'>
            <h3>Confirm Transaction</h3>
            <div className='confirm-details'>
              <div><b>To:</b> <span className='confirm-address'>{confirming.address}</span></div>
              <div><b>Amount:</b> {confirming.amountBch} BCH ({confirming.amountSat} sats)</div>
            </div>
            <div className='confirm-actions'>
              <button className='confirm-send-button' onClick={handleConfirmSend}>
                Confirm Send
              </button>
              <button className='confirm-cancel-button' onClick={handleCancelSend}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SendForm
