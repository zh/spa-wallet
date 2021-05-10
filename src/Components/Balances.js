import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Utils from '../slpwallet/Utils';
import Tokens from '../services/tokens.service';

const useStyles = makeStyles((theme) => ({
  table: {
    border: '1px solid grey',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}));

const Balances = (props) => {
  const { domWallet } = props;
  const classes = useStyles();
  const [showUtxo, setShowUtxo] = useState(false);

  if (!domWallet) {
    return;
  }

  const toggleUtxo = () => {
    setShowUtxo(!showUtxo);
  };

  const wallet = domWallet.Wallet;

  return (
    <>
      {wallet.SlpCoins.size === 0 ? (
        <div>No BCH or SLP balance.</div>
      ) : (
        <>
          <strong>Balances:</strong>
          <br />
          <br />
          <table className={classes.table}>
            <thead>
              <tr>
                <th>ticker</th>
                <th>name</th>
                <th>amount</th>
                <th>type</th>
              </tr>
            </thead>
            <tbody>
              <tr key="bch-bal">
                <td>BCH</td>
                <td>BCH</td>
                <td>
                  {wallet
                    .GetBchBalance()
                    .div(10 ** 8)
                    .toFixed(8)}
                </td>
                <td>&nbsp;</td>
              </tr>
              {Array.from(wallet.GetSlpBalances()).map((b) => {
                return (
                  <tr key={`${b[0]}-bal`}>
                    <td>{Tokens.getTicker(wallet, b[0])}</td>
                    <td>{Tokens.getName(wallet, b[0])}</td>
                    <td>{Tokens.getSlpAmountString(wallet, b[1], b[0])}</td>
                    <td>{Tokens.getTypeString(wallet, b[0])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <br />
          <div
            hidden={wallet.BchCoins.size === 0 && wallet.SlpCoins.size === 0}
          >
            <button onClick={toggleUtxo}>
              {showUtxo ? 'Hide' : 'Show'} UTXOs List
            </button>
          </div>
          <br />
          <div hidden={!showUtxo}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>UTXO</th>
                  <th>Amount</th>
                  <th>Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(wallet.BchCoins).map((c) => {
                  return (
                    <tr key={c[0]}>
                      <td>{Utils.keyToOutpointString(c[0])}</td>
                      <td>{c[1].satoshis.div(10 ** 8).toFixed(8)}</td>
                      <td>BCH</td>
                    </tr>
                  );
                })}
                {Array.from(wallet.SlpCoins).map(([tokenId, coins]) => {
                  return Array.from(coins).map((c) => {
                    return (
                      <tr key={c[0]}>
                        <td>{Utils.keyToOutpointString(c[0])}</td>
                        <td>
                          {Tokens.getSlpAmountString(
                            wallet,
                            c[1].amount,
                            tokenId
                          )}
                        </td>
                        <td>{Tokens.getName(wallet, tokenId)}</td>
                        <td>{Tokens.getTypeString(wallet, tokenId)}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default Balances;
