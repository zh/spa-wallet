# Single Page Bitcoin Cash & SLP Web Wallet

[![Add to Homescreen](https://img.shields.io/badge/Skynet-Add%20To%20Homescreen-00c65e?logo=skynet&labelColor=0d0d0d)](https://homescreen.hns.siasky.net/#/skylink/AQDFVs1YvIWEpbQXl8iiLgP6m7vdb7jWLDbDA05Qb6oWzQ)

The project started as a fork of James Cramer's [bitcore-lib-fun](https://github.com/jcramer/bitcore-lib-fun) project. Changes from the original:

- Code renewal: using [Reack hooks](https://reactjs.org/docs/hooks-intro.html) for keeping state
- Original monolithic component split on many small ones
- Connect/reconnect to different BCHD nodes
- Do not show tokens with zero amount
- Basic and Advanced Mode view
- Tables view redesigned - borders, align etc.
- Modal dialog to show tokens details
- Deployable on IPFS (*package.json* fixes)


## Some tips

- **Backup your seed** (click on *"Show Secrets"* button to see it).
- You can **import existing wallet** by entering the seed in the *"WIF or Seed"* box in *Secrets*).
- You can import wallet with *private key (WIF)* (starting with *K..* or *L...*) too.
- Use "Advanced mode" toggle switch to show/hide **advanced controlls** - node switching, show UTXOs etc.
- Click on QR code or address will **copy it to the clipboard**.
- Click on the token row in the balances table will show you **more information** - NFT group, document URI etc.
- In advanced mode, you can see **existing UTXOs** below the *"Balances"* table.
- In advanced mode, before send you can **see created transaction inputs and outputs**, before clicking on *"Send"* button.
- You **need to click** on *"Confirm"* button with **properly entered** address, token and amount to **enable "Send" button**.

## Development

Connecting to a full node:

1. You will need to connect to a BCHD full node that has `slpindex` and `txindex` enabled (see `REACT_APP_RPC_SERVER` in .env.developement).  Run a BCHD full node locally with: `bchd --slpindex --txindex --grpclisten=0.0.0.0`.  You can download and install bchd with an slp-indexer at `https://github.com/simpleledgerinc/bchd`.

2. Using Chrome browser you can connect directly to your full node running by enabling the flag `chrome://flags/#allow-insecure-localhost`.

To run the reactjs web app:

```
npm i
npm start
```

## Disclaimer

THIS WALLET IS CONSIDERED [ALPHA SOFTWARE](https://en.wikipedia.org/wiki/Software_release_life_cycle#Alpha). USE AT YOUR OWN RISK! WE ASSUME NO RESPONSIBILITY NOR LIABILITY IF THERE IS A BUG IN THIS IMPLEMENTATION.
