import React, { useState } from 'react';
import Inputs from './Inputs';
import Outputs from './Outputs';

const TransactionIO = (props) => {
  const { wallet, txn } = props;

  return (
    <div>
      <div hidden={txn.Inputs.length === 0}>
        <strong>Txn Inputs:</strong>
        <br />
        <Inputs txn={txn} wallet={wallet} />
        <div hidden={txn.Inputs.length === 0}>
          <strong>Txn Outputs:</strong>
          <br />
          <Outputs txn={txn} wallet={wallet} />
        </div>
      </div>
    </div>
  );
};

export default TransactionIO;
