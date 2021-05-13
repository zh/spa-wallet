import { useState } from 'react';
import { Confirm, Alert } from 'react-st-modal'; // TODO: replace with material-ui
import { makeStyles } from '@material-ui/core/styles';
import { Big } from 'big.js';
import bchaddr from 'bchaddrjs-slp';
import { Address } from 'bitcore-lib-cash';
import { DUST_LIMIT, TxBuilder } from '../slpwallet/TxBuilder';
import Tokens from '../services/tokens.service';
import TransactionIO from './Send/TransactionsIO';

const useStyles = makeStyles((theme) => ({
  errorTable: {
    border: '0px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  errorTd: {
    color: '#bb0000',
    textAlign: 'center',
  },
  table: {
    border: '1px solid grey',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderSpacing: '0px',
  },
  td: {
    borderRight: '1px solid grey',
    padding: '3px',
    textAlign: 'left',
  },
  payto: {
    width: '380px',
  },
  amount: {
    width: '80px',
  },
}));

const TxnErrorTypes = {
  LOW_BCH_INPUTS: 'insufficient bch inputs',
  LOW_SLP_INPUTS: 'insufficient slp inputs',
  INVALID_OUTPUT_ADDRESS: 'invalid address',
  NON_SLP_ADDRESS: "address isn't slp format",
  INVALID_OUTPUT_AMOUNT: 'invalid amount',
  BELOW_DUST_LIMIT: 'output is lower than dust limit',
  ZERO_SLP_OUTPUT: 'must have slp output > 0',
  TOO_MANY_SLP_DECIMAL_PLACES: 'too many decimal places for this slp token',
};

const ValidationErrorsList = (props) => {
  const classes = useStyles();
  const { errorsList } = props;

  return (
    <div hidden={!errorsList || errorsList.size === 0}>
      <br />
      <strong>Validation Errors</strong>
      <br />
      <table className={classes.errorTable}>
        <tbody>
          {Array.from(errorsList).map((err, i) => {
            return (
              <tr key={i}>
                <td className={classes.errorTd}>{err}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Send = (props) => {
  const classes = useStyles();
  const { domWallet, updateFunc, advanced } = props;
  const txBuilder = domWallet ? new TxBuilder(domWallet.Wallet) : null;

  const [selectedSlpTokenId, setSelectedSlpTokenId] = useState('bch');
  const [txnValidationErrors, setTxnValidationErrors] = useState(new Set());
  const [outputAmountValid, setOutputAmountValid] = useState(false);
  const [outputAmountValue, setOutputAmountValue] = useState(Big(0));
  const [outputAddressValid, setOutputAddressValid] = useState(false);
  const [outputAddressValue, setOutputAddressValue] = useState('');
  const [currentTxn, setCurrentTxn] = useState(txBuilder);

  if (!domWallet) {
    return;
  }

  const wallet = domWallet.Wallet;

  const updateSelectedToken = (event) => {
    setSelectedSlpTokenId(event.target.value);
  };

  const updateOutputValue = (event) => {
    setOutputAmountValue(event.target.value);
    try {
      Big(event.target.value);
    } catch (_) {
      setOutputAmountValid(false);
      return;
    }
    // check
    if (Big(event.target.value).lt(546)) {
      setOutputAmountValid(false);
      return;
    }
    setOutputAmountValid(true);
  };

  const updateOutputAddress = (event) => {
    const validAddress = bchaddr.isValidAddress(event.target.value);
    setOutputAddressValue(event.target.value);
    setOutputAddressValid(validAddress);
  };

  const setMaxAmount = () => {
    if (selectedSlpTokenId === 'bch') {
      setOutputAmountValue(wallet.GetBchBalance().toFixed());
    } else {
      const balance = wallet.GetSlpBalances().get(selectedSlpTokenId);
      const amount = Tokens.getAmount(
        wallet,
        selectedSlpTokenId,
        balance,
        true
      );
      setOutputAmountValue(amount.toFixed());
    }
  };

  const validateAddOutput = () => {
    if (
      !outputAddressValue ||
      !txnValidationErrors ||
      !outputAmountValue ||
      !currentTxn
    ) {
      return 0;
    }
    // address input box
    if (bchaddr.isValidAddress(outputAddressValue)) {
      txnValidationErrors.delete(TxnErrorTypes.INVALID_OUTPUT_ADDRESS);
      if (
        selectedSlpTokenId !== 'bch' &&
        !bchaddr.isSlpAddress(outputAddressValue)
      ) {
        txnValidationErrors.add(TxnErrorTypes.NON_SLP_ADDRESS);
      } else if (selectedSlpTokenId !== 'bch') {
        txnValidationErrors.delete(TxnErrorTypes.NON_SLP_ADDRESS);
      }
    } else {
      txnValidationErrors.add(TxnErrorTypes.INVALID_OUTPUT_ADDRESS);
      txnValidationErrors.delete(TxnErrorTypes.NON_SLP_ADDRESS);
    }

    // amount input box
    try {
      Big(outputAmountValue);
      txnValidationErrors.delete(TxnErrorTypes.INVALID_OUTPUT_AMOUNT);
    } catch (_) {
      txnValidationErrors.add(TxnErrorTypes.INVALID_OUTPUT_AMOUNT);
    }

    if (selectedSlpTokenId === 'bch') {
      if (outputAmountValue && Big(outputAmountValue).lt(546)) {
        txnValidationErrors.add(TxnErrorTypes.BELOW_DUST_LIMIT);
      } else {
        txnValidationErrors.delete(TxnErrorTypes.BELOW_DUST_LIMIT);
      }

      if (outputAmountValue) {
        const unspentAmt = Array.from(wallet.BchCoins).reduce(
          (p, c, i) => p.add(c[1].satoshis),
          Big(0)
        );
        const outputAmt = currentTxn.Outputs.reduce(
          (p, c, i) => p.add(c[0].satoshis),
          Big(0)
        ).add(outputAmountValue);
        if (outputAmt.gt(unspentAmt)) {
          txnValidationErrors.add(TxnErrorTypes.LOW_BCH_INPUTS);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);
        }
      } else {
        txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);
      }
    } else {
      txnValidationErrors.delete(TxnErrorTypes.BELOW_DUST_LIMIT);
      txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);

      // check slp balance
      if (outputAmountValue) {
        const tokenAmt = Tokens.getAmount(
          wallet,
          selectedSlpTokenId,
          new Big(outputAmountValue)
        );

        if (outputAmountValue && tokenAmt.lt(1)) {
          txnValidationErrors.add(TxnErrorTypes.ZERO_SLP_OUTPUT);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.ZERO_SLP_OUTPUT);
        }

        const slpCoins = wallet.SlpCoins.get(selectedSlpTokenId);
        const unspentSlpAmt = Array.from(slpCoins).reduce(
          (p, c, i) => p.add(c[1].amount),
          Big(0)
        );
        const slpChangeAmt = currentTxn.SlpChangeOutput
          ? currentTxn.SlpChangeOutput.amount
          : 0;
        const outputAmt = currentTxn.SlpOutputs.reduce(
          (p, c, i) => p.add(c),
          Big(0)
        )
          .add(tokenAmt)
          .sub(slpChangeAmt);
        if (outputAmt.gt(unspentSlpAmt)) {
          txnValidationErrors.add(TxnErrorTypes.LOW_SLP_INPUTS);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.LOW_SLP_INPUTS);
        }

        // TODO: actually check if slp change output will be needed
        const changeDust = currentTxn.SlpChangeOutput ? DUST_LIMIT : 0;
        const opReturnSize = 10 + 32 + 9 * currentTxn.SlpOutputs.length;

        // check for sufficient bch balance when new slp output (bch dust) is added
        const unspentBchAmt = Array.from(wallet.BchCoins).reduce(
          (p, c, i) => p.add(c[1].satoshis),
          Big(0)
        );
        const bchChangeAmt = currentTxn.BchChangeOutput
          ? currentTxn.BchChangeOutput.amount
          : 0;
        const outputBchAmt = currentTxn.Outputs.reduce(
          (p, c, i) => p.add(c[0].satoshis),
          Big(0)
        )
          .add(DUST_LIMIT)
          .add(changeDust)
          .add(opReturnSize)
          .sub(bchChangeAmt);
        if (outputBchAmt.gt(unspentBchAmt)) {
          txnValidationErrors.add(TxnErrorTypes.LOW_BCH_INPUTS);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);
        }

        // check input amount decimal places doesn't exceed
        if (tokenAmt.lt(1)) {
          txnValidationErrors.add(TxnErrorTypes.TOO_MANY_SLP_DECIMAL_PLACES);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.TOO_MANY_SLP_DECIMAL_PLACES);
        }
      } else {
        txnValidationErrors.delete(TxnErrorTypes.LOW_SLP_INPUTS);
        txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);
        txnValidationErrors.delete(TxnErrorTypes.ZERO_SLP_OUTPUT);
        txnValidationErrors.delete(TxnErrorTypes.TOO_MANY_SLP_DECIMAL_PLACES);
      }
    }

    if (txnValidationErrors.size > 0) {
      updateFunc();
    }

    return txnValidationErrors.size;
  };

  const addOutput = () => {
    if (!currentTxn || validateAddOutput() > 0) {
      return;
    }

    // get address and value
    const addr = bchaddr.toCashAddress(outputAddressValue);
    const val = Big(outputAmountValue);

    // Add bch or slp output
    switch (selectedSlpTokenId) {
      case 'bch':
        if (!currentTxn.AddBchOutput(new Address(addr), val.toNumber())) {
          txnValidationErrors.add(TxnErrorTypes.LOW_BCH_INPUTS);
        } else {
          txnValidationErrors.delete(TxnErrorTypes.LOW_BCH_INPUTS);
        }
        break;
      default:
        const tokenAmt = Tokens.getAmount(wallet, selectedSlpTokenId, val);
        currentTxn.AddSlpOutput(addr, tokenAmt, selectedSlpTokenId);
        break;
    }

    updateFunc();
  };

  const sendTransaction = async () => {
    try {
      const { txnHex, fee, sendAmount } = await currentTxn.SignTransaction(
        () => wallet.PrivateKey
      );
      console.log(txnHex);
      const ok = await Confirm(
        `${sendAmount} satoshis with fee: ${fee} satoshis?`,
        'Sending transaction'
      );
      if (ok) {
        const explorerUri = 'https://explorer.bitcoin.com/bch/tx/';
        const txid = await wallet.SendTransaction(txnHex);
        await Alert(
          <a
            href={`${explorerUri}${txid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txid}
          </a>,
          'Broadcasted'
        );
      }
    } catch (err) {
      // TODO: parse various error responses for better UI
      await Alert(`Error: ${err.message}`);
    } finally {
      clearTransaction();
    }
  };

  const clearTransaction = () => {
    setOutputAddressValue('');
    setOutputAmountValue('');
    setSelectedSlpTokenId('bch');
    setTxnValidationErrors(new Set());
    setCurrentTxn(new TxBuilder(wallet));
    updateFunc();
  };

  return (
    <>
      <div>
        <strong>Send</strong>
        <br />
        <label htmlFor="payto">PayTo: </label>
        <input
          className={classes.payto}
          id="payto"
          value={outputAddressValue}
          placeholder={
            selectedSlpTokenId === 'bch' ? 'cash or slp address' : 'slp address'
          }
          onChange={updateOutputAddress}
        ></input>
        <br />
        <label htmlFor="coin">Coin: </label>
        <select
          id="coin"
          value={selectedSlpTokenId}
          onChange={updateSelectedToken}
        >
          {Array.from(wallet.GetSlpBalances()).map((b) => {
            if (Big(b[1]).toFixed() > 0) {
              return (
                <option key={b[0]} value={b[0]}>{`SLP -> ${Tokens.getName(
                  wallet,
                  b[0]
                )} (${Tokens.getTypeString(wallet, b[0])})`}</option>
              );
            }
          })}
          <option key="bch" value="bch">
            Bitcoin Cash
          </option>
        </select>
        &nbsp;&nbsp;
        <label htmlFor="amount">Amount: </label>
        <input
          className={classes.amount}
          id="amount"
          value={outputAmountValue}
          placeholder={Tokens.getTicker(wallet)}
          onChange={updateOutputValue}
        ></input>
        &nbsp;&nbsp;
        <button onClick={setMaxAmount}>Max</button>
        <br />
        <br />
        {currentTxn && txnValidationErrors.size === 0 && (
          <button onClick={addOutput}>Confirm</button>
        )}
        &nbsp;&nbsp;
        <button onClick={clearTransaction}>Clear</button>
        <br />
        <ValidationErrorsList errorsList={txnValidationErrors} />
        <br />
        {advanced && currentTxn && txnValidationErrors.size === 0 && (
          <>
            <TransactionIO txn={currentTxn} wallet={wallet} />
            <br />
          </>
        )}
      </div>
      <button
        disabled={
          (currentTxn && currentTxn.Outputs.length === 0) ||
          (txnValidationErrors && txnValidationErrors.size !== 0)
        }
        onClick={sendTransaction}
      >
        Send
      </button>
      <br />
    </>
  );
};

export default Send;
