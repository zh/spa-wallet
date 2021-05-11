import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
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

const Outputs = (props) => {
  const { txn, wallet } = props;
  const classes = useStyles();

  return (
    <table className={classes.table}>
      <tbody>
        {Array.from(txn.Outputs).map((output, i) => {
          if (output[0].script.isDataOut()) {
            return (
              <tr key={i}>
                <td className={classes.td}>SLP Metadata message (OP_RETURN)</td>
                <td className={classes.td}>{`${
                  output[0].script.toBuffer().length
                } bytes`}</td>
                <td className={classes.td}>{`${output[0].satoshis} sats`}</td>
              </tr>
            );
          }
          let slpOuts = txn.SlpOutputs;
          if (slpOuts.length > 0 && i <= slpOuts.length) {
            return (
              <tr key={i}>
                <td className={classes.td}>{`${output[0].script
                  .toAddress()
                  .toCashAddress()}`}</td>
                <td className={classes.td}>{`${Tokens.getSlpAmountString(
                  wallet,
                  slpOuts[i - 1]
                )} ${Tokens.getTicker(wallet)}`}</td>
                <td className={classes.td}>{`${output[0].satoshis} sats`}</td>
              </tr>
            );
          }
          return (
            <tr key={i}>
              <td className={classes.td}>{`${output[0].script
                .toAddress()
                .toCashAddress()}`}</td>
              <td className={classes.td}>&nbsp;</td>
              <td className={classes.td}>{`${output[0].satoshis} sats`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Outputs;
