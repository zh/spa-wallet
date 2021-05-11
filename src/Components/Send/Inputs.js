import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Utils from '../../slpwallet/Utils';
import Tokens from '../../services/tokens.service';

const useStyles = makeStyles((theme) => ({
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
}));

const Inputs = (props) => {
  const { txn, wallet } = props;
  const classes = useStyles();

  return (
    <table className={classes.table}>
      <tbody>
        {Array.from(txn.Inputs).map((input, i) => {
          const outpoint = Utils.outpointToKey(
            input.prevTxId,
            input.outputIndex,
            true
          );
          const slpOut = wallet.SlpOutpointCache.get(outpoint);
          if (slpOut) {
            return (
              <tr key={i}>
                <td className={classes.td}>{`${input.prevTxId.toString(
                  'hex'
                )}:${input.outputIndex}`}</td>
                <td className={classes.td}>
                  {`${Tokens.getSlpAmountString(
                    wallet,
                    slpOut.amount,
                    slpOut.tokenId
                  )} ${Tokens.getTicker(wallet, slpOut.tokenId)}`}
                </td>
                <td className={classes.td}>{`${slpOut.satoshis} sats`}</td>
              </tr>
            );
          }
          return (
            <tr key={i}>
              <td className={classes.td}>{`${input.prevTxId.toString('hex')}:${
                input.outputIndex
              }`}</td>
              <td className={classes.td}>BCH</td>
              <td className={classes.td}>{`${
                input.output ? input.output.satoshis : '?'
              } sats`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Inputs;
