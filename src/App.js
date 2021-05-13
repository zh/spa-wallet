import { useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, CircularProgress } from '@material-ui/core';
import { DomWallet } from './slpwallet';
import Header from './Components/Header';
import Footer from './Components/Footer';
import NodeSwitch from './Components/NodeSwitch';
import Address from './Components/Address';
import Balances from './Components/Balances';
import Send from './Components/Send';
import ModeSwitch from './Components/ModeSwitch.js';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    textAlign: 'center',
  },
  privateKeys: {
    width: '410px',
  },
  buttonWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

//create your forceUpdate hook
function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

const App = () => {
  const forceUpdate = useForceUpdate();

  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const domWallet = useMemo(() => {
    setLoading(true);
    const newWallet = new DomWallet(forceUpdate);
    newWallet.Wallet.LoadInitialBalances();
    newWallet.Wallet.Subscribe();
    setLoading(false);
    return newWallet;
  }, []);

  return (
    <Container className={classes.root} maxWidth="md">
      <Header />
      <br />
      <div className={classes.buttonWrapper}>
        <ModeSwitch
          checked={advanced}
          onChange={() => setAdvanced(!advanced)}
        />
        <button onClick={forceUpdate}>
          <i className="fa fa-refresh"></i>
          &nbsp;Refresh
        </button>
      </div>
      <hr />
      {!domWallet || loading ? (
        <CircularProgress />
      ) : (
        <>
          {advanced && (
            <NodeSwitch domWallet={domWallet} updateFunc={forceUpdate} />
          )}
          <br />
          <Address domWallet={domWallet} updateFunc={forceUpdate} />
          <hr />
          <Balances domWallet={domWallet} advanced={advanced} />
          <hr />
        </>
      )}
      <Send
        domWallet={domWallet}
        updateFunc={forceUpdate}
        advanced={advanced}
      />
      <br />
      <Footer />
    </Container>
  );
};

export default App;
