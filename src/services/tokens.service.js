import { Big } from 'big.js';
import { TokenMetadata } from 'grpc-bchrpc-web/pb/bchrpc_pb';

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
  if (tm.hasType1()) {
    nameBuf = tm.getType1().getTokenTicker_asU8();
  } else if (tm.hasNft1Group()) {
    nameBuf = tm.getNft1Group().getTokenTicker_asU8();
  } else if (tm.hasNft1Child()) {
    nameBuf = tm.getNft1Child().getTokenTicker_asU8();
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
  if (tm.hasType1()) {
    nameBuf = tm.getType1().getTokenName_asU8();
  } else if (tm.hasNft1Group()) {
    nameBuf = tm.getNft1Group().getTokenName_asU8();
  } else if (tm.hasNft1Child()) {
    nameBuf = tm.getNft1Child().getTokenName_asU8();
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
  if (tm.hasType1()) {
    decimals = tm.getType1().getDecimals();
  } else if (tm.hasNft1Group()) {
    decimals = tm.getNft1Group().getDecimals();
  } else if (tm.hasNft1Child()) {
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
    case TokenMetadata.TypeMetadataCase.TYPE1:
      return 'Token';
    case TokenMetadata.TypeMetadataCase.NFT1_GROUP:
      return 'NFT Group';
    case TokenMetadata.TypeMetadataCase.NFT1_CHILD:
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
  if (tm.hasType1()) {
    decimals = tm.getType1().getDecimals();
  } else if (tm.hasNft1Group()) {
    decimals = tm.getNft1Group().getDecimals();
  } else if (tm.hasNft1Child()) {
    decimals = 0;
  } else {
    throw Error('unknown token type');
  }
  return amount.div(10 ** decimals).toFixed();
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getName,
  getAmount,
  getTicker,
  getTypeString,
  getSlpAmountString,
};
