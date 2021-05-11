import { useState } from 'react';

const publicBchdNodes = [
  'bchd.fountainhead.cash',
  'bchd-mainnet.electroncash.de',
  'bchd.imaginary.cash/proxy',
  'bchd.greyh.at:8335',
  'localhost:8335',
];

const NodeSwitch = (props) => {
  const { domWallet, updateFunc } = props;
  const [nodeUri, setNodeUri] = useState(publicBchdNodes[0]);

  const updateNodeUri = (event) => {
    let uri = event.target.value;
    if (publicBchdNodes.includes(nodeUri)) {
      console.log(uri);
      setNodeUri(uri);
      domWallet.setNode(uri);
      domWallet.Wallet.LoadInitialBalances();
      domWallet.Wallet.Subscribe();
    }
  };

  const currentNodeUri = () => {
    return domWallet.Storage.GetNode() || publicBchdNodes[0];
  };

  return (
    <div>
      <label htmlFor="node">Node: </label>
      <select id="node" value={currentNodeUri()} onChange={updateNodeUri}>
        {publicBchdNodes.map((nodeUri) => (
          <option key={nodeUri} value={nodeUri}>
            {nodeUri}
          </option>
        ))}
      </select>
      <button onClick={updateFunc}>
        <i className="fa fa-refresh"></i>
        &nbsp;Refresh
      </button>
    </div>
  );
};

export default NodeSwitch;
