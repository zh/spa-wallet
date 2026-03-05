# spa-wallet

A lightweight Bitcoin Cash web wallet built with React 18 and Vite.

## Features

- Send and receive BCH
- QR code address display
- Multi-server switching (FullStack.cash, BCH Consumer, Local Dev)
- BCH Name Service — resolve `.bch` names to addresses
- Intelligent balance polling with adaptive intervals
- Mnemonic-based HD wallet management
- Copy-to-clipboard with visual feedback

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/zh/spa-wallet.git
cd spa-wallet
npm install
```

### Environment Configuration

Copy and edit the `.env` file to configure the BCH Name Service resolver:

```
VITE_RESOLVER_URL=http://127.0.0.1:3100
VITE_RESOLVER_TLD=psf
```

### Run

```bash
npm run dev
```

## Architecture

The wallet loads [minimal-slp-wallet](https://github.com/Permissionless-Software-Foundation/minimal-slp-wallet) v7.1.4 as a pre-built IIFE bundle. An esbuild script (`esbuild-wallet.config.js`) compiles the library with Node polyfills into `public/minimal-slp-wallet.iife.js`, which is loaded via a `<script>` tag. The wallet instance is then available globally at `window.SlpWallet`.

### Project Structure

```
src/
  App.jsx              — Main app shell
  BCHWallet.jsx        — Wallet initialization and server config
  components/
    AddressDisplay.jsx — QR code and address display
    SendForm.jsx       — BCH send form
    ServerSelector.jsx — Server switching UI
    WalletInfo.jsx     — Balance and wallet details
  hooks/
    useBalancePoller.js — Adaptive balance polling
    useCopyFeedback.js  — Copy-to-clipboard feedback
  utils/
    bch-ns.js          — BCH Name Service resolution
    errorHandler.js    — Error handling utilities
    validation.js      — Input validation
  components.css       — All component styles (single file)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (builds IIFE first) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_RESOLVER_URL` | BCH Name Service resolver endpoint | `http://127.0.0.1:3100` |
| `VITE_RESOLVER_TLD` | Top-level domain for name resolution | `psf` |

## Notes

- SLP token support is not yet implemented
- No client-side routing — single-page app with flat component structure
- No external state management library — uses React state and props
