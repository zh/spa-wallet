import { useState } from 'react';
import { CustomDialog } from 'react-st-modal';
import { Big } from 'big.js';
import { makeStyles } from '@material-ui/core/styles';
import Utils from '../slpwallet/Utils';
import Tokens from '../services/tokens.service';
import NftInfoModal from './NftInfoModal';

const useStyles = makeStyles((theme) => ({
  table: {
    border: '1px solid grey',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderSpacing: '0px',
  },
  th: {
    borderRight: '1px solid grey',
    borderBottom: '1px solid grey',
  },
  td: {
    borderRight: '1px solid grey',
    padding: '2px',
    textAlign: 'left',
  },
  tdNum: {
    borderRight: '1px solid grey',
    textAlign: 'right',
  },
}));

const Balances = (props) => {
  const { domWallet, advanced } = props;
  const classes = useStyles();
  const [showUtxo, setShowUtxo] = useState(false);

  if (!domWallet) {
    return;
  }
  const wallet = domWallet.Wallet;

  const toggleUtxo = () => {
    setShowUtxo(!showUtxo);
  };

  const slpInfo = async (tokenId, amount) => {
    await CustomDialog(
      <NftInfoModal wallet={wallet} tokenId={tokenId} amount={amount} />,
      {
        title: `Token: ${tokenId}`,
        showCloseIcon: true,
      }
    );
  };

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
                <th className={classes.th}>ticker</th>
                <th className={classes.th}>name</th>
                <th className={classes.th}>amount (bch)</th>
                <th className={classes.th}>details</th>
              </tr>
            </thead>
            <tbody>
              <tr key="bch-bal">
                <td className={classes.td}>BCH</td>
                <td className={classes.td}>BCH</td>
                <td className={classes.tdNum}>
                  {wallet
                    .GetBchBalance()
                    .div(10 ** 8)
                    .toFixed(8)}
                </td>
                <td className={classes.tdNum}>
                  {wallet
                    .GetBchBalance().toFixed()}
                </td>
              </tr>
              {Array.from(wallet.GetSlpBalances()).map((b) => {
                if (Big(b[1]).toFixed() > 0) {
                  return (
                    <tr
                      key={`${b[0]}-bal`}
                      onClick={async () => slpInfo(b[0], Big(b[1]).toFixed())}
                    >
                      <td className={classes.td}>
                        {Tokens.getTicker(wallet, b[0])}
                      </td>
                      <td className={classes.td}>
                        {Tokens.getName(wallet, b[0])}
                      </td>
                      <td className={classes.tdNum}>
                        {Tokens.getSlpAmountString(wallet, b[1], b[0])}
                      </td>
                      <td className={classes.td}>
                        {Tokens.getTypeString(wallet, b[0])}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
          <br />
          {advanced && (
            <>
              <div
                hidden={
                  wallet.BchCoins.size === 0 && wallet.SlpCoins.size === 0
                }
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
                      <th className={classes.th}>UTXO</th>
                      <th className={classes.th}>Amount</th>
                      <th className={classes.th}>Name</th>
                      <th className={classes.th}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(wallet.BchCoins).map((c) => {
                      return (
                        <tr key={c[0]}>
                          <td className={classes.td}>
                            {Utils.keyToOutpointString(c[0])}
                          </td>
                          <td className={classes.tdNum}>
                            {c[1].satoshis.div(10 ** 8).toFixed(8)}
                          </td>
                          <td className={classes.td}>BCH</td>
                          <td className={classes.td}>BCH</td>
                        </tr>
                      );
                    })}
                    {Array.from(wallet.SlpCoins).map(([tokenId, coins]) => {
                      return Array.from(coins).map((c) => {
                        if (Big(c[1].amount).toFixed() > 0) {
                          return (
                            <tr key={c[0]}>
                              <td className={classes.td}>
                                {Utils.keyToOutpointString(c[0])}
                              </td>
                              <td className={classes.tdNum}>
                                {Tokens.getSlpAmountString(
                                  wallet,
                                  c[1].amount,
                                  tokenId
                                )}
                              </td>
                              <td className={classes.td}>
                                {Tokens.getName(wallet, tokenId)}
                              </td>
                              <td className={classes.td}>
                                {Tokens.getTypeString(wallet, tokenId)}
                              </td>
                            </tr>
                          );
                        }
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Balances;
