import { Big } from 'big.js';
import { SlpTokenMetadata } from 'grpc-bchrpc-web/pb/bchrpc_pb';

const getTicker = (wallet, tokenId) => {
  if (!tokenId) {
    tokenId = 'bch';
  }
  if (tokenId === 'bch') {
    return 'satoshis';
  }
  if (!wallet.TokenMetadata.has(tokenId)) {
    return `?`;
  }
  const tm = wallet.TokenMetadata.get(tokenId);
  if (!tm) {
    return '?';
  }
  let nameBuf;
  if (tm.hasV1Fungible()) {
    nameBuf = tm.getV1Fungible().getTokenTicker();
  } else if (tm.hasV1Nft1Group()) {
    nameBuf = tm.getV1Nft1Group().getTokenTicker();
  } else if (tm.hasV1Nft1Child()) {
    nameBuf = tm.getV1Nft1Child().getTokenTicker();
  } else {
    throw Error('unknown token type');
  }
  return Buffer.from(nameBuf).toString('utf8');
};

const getName = (wallet, tokenId) => {
  if (tokenId === 'bch') {
    return 'Bitcoin Cash';
  }
  if (!wallet.TokenMetadata.has(tokenId)) {
    return `${tokenId.slice(0, 10)}...${tokenId.slice(54, 64)}`;
  }
  const tm = wallet.TokenMetadata.get(tokenId);
  if (!tm) {
    return '?';
  }
  let nameBuf;
  if (tm.hasV1Fungible()) {
    nameBuf = tm.getV1Fungible().getTokenName();
  } else if (tm.hasV1Nft1Group()) {
    nameBuf = tm.getV1Nft1Group().getTokenName();
  } else if (tm.hasV1Nft1Child()) {
    nameBuf = tm.getV1Nft1Child().getTokenName();
  } else {
    throw Error('unknown token type');
  }
  return Buffer.from(nameBuf).toString('utf8');
};

const getAmount = (wallet, tokenId, val, display = false) => {
  const tm = wallet.TokenMetadata.get(tokenId);
  let decimals;
  if (!tm) {
    return Big('0').toFixed();
  }
  if (tm.hasV1Fungible()) {
    decimals = tm.getV1Fungible().getDecimals();
  } else if (tm.hasV1Nft1Group()) {
    decimals = tm.getV1Nft1Group().getDecimals();
  } else if (tm.hasV1Nft1Child()) {
    decimals = 0;
  } else {
    throw Error('unknown token type');
  }
  if (display) {
    return val.div(10 ** decimals);
  }
  return val.mul(10 ** decimals);
};

const getTypeString = (wallet, tokenId) => {
  const tm = wallet.TokenMetadata.get(tokenId);
  if (!tm) {
    return '?';
  }
  switch (tm.getTypeMetadataCase()) {
    case SlpTokenMetadata.TypeMetadataCase.V1_FUNGIBLE:
      return 'Token';
    case SlpTokenMetadata.TypeMetadataCase.V1_NFT1_GROUP:
      return 'NFT Group';
    case SlpTokenMetadata.TypeMetadataCase.V1_NFT1_CHILD:
      return 'NFT';
    default:
      return '?';
  }
};

const getSlpAmountString = (wallet, amount, tokenId) => {
  if (!tokenId) {
    tokenId = 'bch';
  }
  const tm = wallet.TokenMetadata.get(tokenId);
  if (!tm) {
    return Big('0').toFixed();
  }
  let decimals;
  if (tm.hasV1Fungible()) {
    decimals = tm.getV1Fungible().getDecimals();
  } else if (tm.hasV1Nft1Group()) {
    decimals = tm.getV1Nft1Group().getDecimals();
  } else if (tm.hasV1Nft1Child()) {
    decimals = 0;
  } else {
    throw Error('unknown token type');
  }
  return amount.div(10 ** decimals).toFixed();
};

// use with NFTs only
const metaToObj = (wallet, tokenId) => {
  const tokenType = getTypeString(wallet, tokenId);
  const obj = {
    id: tokenId,
    type: tokenType,
    name: getName(wallet, tokenId),
    ticker: getTicker(wallet, tokenId),
  };
  if (tokenType.startsWith('NFT')) {
    const tm = wallet.TokenMetadata.get(tokenId);
    if (tm.hasV1Nft1Group()) {
      const uri = tm.getV1Nft1Group().getTokenDocumentUrl();
      obj.uri = uri ? Buffer.from(uri).toString('utf8') : '';
    } else if (tm.hasV1Nft1Child()) {
      const uri = tm.getV1Nft1Child().getTokenDocumentUrl();
      obj.uri = uri ? Buffer.from(uri).toString('utf8') : '';
      obj.parentId = Buffer.from(tm.getV1Nft1Child().getGroupId()).toString(
        'hex'
      );
    }
  }
  return obj;
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getName,
  getAmount,
  getTicker,
  getTypeString,
  getSlpAmountString,
  metaToObj,
};
