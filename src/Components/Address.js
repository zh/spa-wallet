import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import QRCode from 'qrcode.react';
import bchaddr from 'bchaddrjs-slp';

const useStyles = makeStyles((theme) => ({
  privateKeys: {
    width: '410px',
  },
  qrSuccess: {
    color: '#009900',
  },
}));

const Address = (props) => {
  const { domWallet, updateFunc } = props;
  const classes = useStyles();

  const [showMnemonic, setShowMnemonic] = useState(false);
  const [address, setAddress] = useState(
    domWallet.Wallet.Address.toCashAddress()
  );
  const [showSlpAddressFormat, setShowSlpAddressFormat] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const toggleMnemonic = () => {
    setShowMnemonic(!showMnemonic);
  };

  const importMnemonic = (event) => {
    if (!domWallet) {
      return;
    }
    const userValue = event.target.value;
    if (!userValue) {
      return;
    }
    try {
      domWallet.Wallet.UpdateMnemonic(userValue);
      setAddress(domWallet.Wallet.Address.toCashAddress());
    } catch (_) {
      console.log(`invalid wif: ${userValue}`);
    }
    setShowMnemonic(false);
    updateFunc();
  };

  const toggleAddrFormat = () => {
    setShowCopySuccess(false);
    const newAddress = domWallet.Wallet.Address.toCashAddress();
    if (!showSlpAddressFormat) {
      setAddress(bchaddr.toSlpAddress(newAddress));
    } else {
      setAddress(newAddress);
    }
    setShowSlpAddressFormat(!showSlpAddressFormat);
  };

  const copyToClipboard = (event) => {
    event.preventDefault();
    navigator.clipboard.writeText(address);
    setShowCopySuccess(true);
  };

  return (
    <>
      <div>
        <strong>Back up your funds with your seed or WIF!!!</strong>
        <br />
        <br />
        <button onClick={toggleMnemonic}>
          {showMnemonic ? 'Hide' : 'Show'} Secrets
        </button>
        <a
          href="https://iancoleman.io/bip39/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Generate Keys (BIP39)
        </a>
        <div hidden={!showMnemonic}>
          WIF or seed:{' '}
          <input
            className={classes.privateKeys}
            defaultValue={`${
              domWallet.Wallet.Mnemonic
                ? domWallet.Wallet.Mnemonic
                : domWallet.Wallet.Wif
            }`}
            onChange={importMnemonic}
          />
          <br />
          <div hidden={domWallet.Wallet.XPub === null}>
            Xpub:
            <br />
            {domWallet.Wallet.XPub}
          </div>
        </div>
      </div>
      <hr />
      <div>
        <strong>Your wallet address:</strong>
        <br />
        <br />
        <div onClick={copyToClipboard}>
          <QRCode value={address} />
          <br />
          <br />
          <div className={classes.qrText}>{address}</div>

          {showCopySuccess && (
            <div className={classes.qrSuccess}> (copied!) </div>
          )}
        </div>
        <br />
        <button onClick={toggleAddrFormat}>
          Switch to {showSlpAddressFormat ? 'cash' : 'slp'}Addr format
        </button>
      </div>
    </>
  );
};

export default Address;
