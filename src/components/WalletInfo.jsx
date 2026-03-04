import { useState } from 'react'

const WalletInfo = ({ wallet, mnemonicInput, onMnemonicChange, onSaveMnemonic, onResetMnemonic, onCopy }) => {
  const [showInfo, setShowInfo] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const cashAddress = wallet?.walletInfo?.cashAddress || ''
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
          <div className='info-row' onClick={() => onCopy(cashAddress)}>
            <b>Address:</b> {cashAddress}
          </div>
          <div className='info-row' onClick={() => onCopy(legacyAddress)}>
            <b>Legacy:</b> {legacyAddress}
          </div>
          <div className='info-row'>
            <b>Private Key:</b>{' '}
            {showPrivateKey
              ? <span onClick={() => onCopy(privateKey)} style={{ cursor: 'pointer' }}>{privateKey}</span>
              : <span className='private-key-masked'>{'*'.repeat(20)}</span>
            }
            <button
              className='reveal-button'
              onClick={() => setShowPrivateKey(!showPrivateKey)}
            >
              {showPrivateKey ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div className='info-row' onClick={() => onCopy(hdPath)}>
            <b>HD Path:</b> {hdPath}
          </div>
          <div className='mnemonic-edit'>
            <b>Mnemonic:</b>
            <textarea
              className='mnemonic-input'
              rows={2}
              value={mnemonicInput}
              onChange={(e) => onMnemonicChange(e.target.value)}
            />
            <div className='mnemonic-actions'>
              <button type='button' onClick={onSaveMnemonic}>Save</button>
              <button type='button' className='reset-button' onClick={onResetMnemonic}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletInfo
