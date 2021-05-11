import {
  ModalContent,
  ModalFooter,
  ModalButton,
  useDialog,
} from 'react-st-modal';
import { makeStyles } from '@material-ui/core/styles';
import Tokens from '../services/tokens.service';

const explorerUri = 'https://simpleledger.info/token/';

const useStyles = makeStyles((theme) => ({
  paper: {
    width: '500px',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2, 4, 3),
  },
  table: {
    border: '1px solid grey',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderSpacing: '0px',
  },
  td: {
    borderRight: '1px solid grey',
    borderBottom: '1px solid grey',
    padding: '3px',
    textAlign: 'left',
  },
}));

// The element to be shown in the modal window
const NftInfoModal = (props) => {
  const { wallet, tokenId, amount } = props;
  const classes = useStyles();
  // use this hook to control the dialog
  const dialog = useDialog();
  const tokenObj = Tokens.metaToObj(wallet, tokenId);

  return (
    <div className={classes.paper}>
      <ModalContent>
        <table className={classes.table}>
          <tbody>
            <tr key="nft-type">
              <td className={classes.td}>Type</td>
              <td className={classes.td}>{tokenObj.type}</td>
            </tr>
            <tr key="nft-ticker">
              <td className={classes.td}>Ticker</td>
              <td className={classes.td}>{tokenObj.ticker}</td>
            </tr>
            <tr key="nft-name">
              <td className={classes.td}>Name</td>
              <td className={classes.td}>{tokenObj.name}</td>
            </tr>
            <tr key="nft-amount">
              <td className={classes.td}>Amount</td>
              <td className={classes.td}>{amount}</td>
            </tr>
            {tokenObj.type.startsWith('NFT') && (
              <tr key="nft-token">
                <td className={classes.td}>Token Info</td>
                <td className={classes.td}>
                  <a
                    href={`${explorerUri}${tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More token info...
                  </a>
                </td>
              </tr>
            )}
            {tokenObj.type.startsWith('NFT') && tokenObj.parentId && (
              <tr key="nft-group">
                <td className={classes.td}>Group ID</td>
                <td className={classes.td}>
                  <a
                    href={`${explorerUri}${tokenObj.parentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More group info...
                  </a>
                </td>
              </tr>
            )}
            {tokenObj.type.startsWith('NFT') && (
              <tr key="nft-doc-uri">
                <td className={classes.td}>Doc URI</td>
                <td className={classes.td}>{tokenObj.uri}</td>
              </tr>
            )}
          </tbody>
        </table>
      </ModalContent>
      <ModalFooter>
        <ModalButton
          onClick={() => {
            dialog.close();
          }}
        >
          OK
        </ModalButton>
      </ModalFooter>
    </div>
  );
};

export default NftInfoModal;
