import { memo } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const shortify = (address) => {
  const parts = address.split(':')
  const addr = parts.length > 1 ? parts[1] : parts[0]
  return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`
}

const MemoizedQR = memo(({ value }) => (
  <QRCodeSVG value={value} size={128} />
))
MemoizedQR.displayName = 'MemoizedQR'

const AddressDisplay = ({ cashAddress, copyMsg, onCopy }) => {
  const isFeedback = copyMsg === 'Copied!' || copyMsg.startsWith('Failed')
  const feedbackClass = copyMsg === 'Copied!'
    ? 'address copy-msg-success'
    : copyMsg.startsWith('Failed')
      ? 'address copy-msg-error'
      : 'address'

  return (
    <div className='container address-container'>
      <div className='qr-code' onClick={() => onCopy(cashAddress)}>
        <MemoizedQR value={cashAddress} />
      </div>
      <div className={feedbackClass} onClick={() => onCopy(cashAddress)} style={{ cursor: 'pointer' }}>
        {isFeedback ? copyMsg : shortify(cashAddress)}
      </div>
    </div>
  )
}

export default AddressDisplay
