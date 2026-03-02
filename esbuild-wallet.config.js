import * as esbuild from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

// Rebuild minimal-slp-wallet with keepNames: true so that
// typeforce class-name checks (e.g. BigInteger) survive minification.
esbuild.build({
  entryPoints: ['node_modules/minimal-slp-wallet/index.js'],
  bundle: true,
  minify: true,
  keepNames: true,
  format: 'iife',
  globalName: 'SlpWallet',
  outfile: 'public/minimal-slp-wallet.min.js',
  plugins: [
    polyfillNode({
      polyfills: {
        crypto: true,
        buffer: true,
        stream: true,
        assert: true,
        process: true,
        util: true,
        events: true
      }
    })
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis'
  }
}).then(() => {
  console.log('Wallet bundle built with keepNames: true')
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
