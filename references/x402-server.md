# x402 Server

Use this when the user wants to add payment requirements to API routes.

## Install

```bash
npm install @fastxyz/x402-server
```

## Public API

```ts
import {
  paymentMiddleware,
  createPaymentRequired,
  verifyPayment,
  settlePayment,
} from '@fastxyz/x402-server';
```

## Standard Express Setup

```ts
import express from 'express';
import { paymentMiddleware } from '@fastxyz/x402-server';

const app = express();

app.use(paymentMiddleware(
  {
    evm: '0x1234...',
    fast: 'fast1abc...',
  },
  {
    'GET /api/premium/*': {
      price: '$0.10',
      network: 'arbitrum-sepolia',
    },
  },
  { url: 'http://localhost:4020' },
));
```

## What The Package Does

- build 402 response payloads
- match configured routes
- parse `X-PAYMENT`
- call the facilitator to verify payments
- call the facilitator to settle EVM payments

## Route Config Notes

Each route config needs:

- `price`
- `network`

Optional config can add:

- `description`
- `mimeType`
- `asset`

Price strings can be human-readable like `'$0.10'` or raw like `'100000'`.

## Facilitator Dependency

This package is not the settlement engine. For working payment verification and EVM settlement, run `@fastxyz/x402-facilitator` and point the middleware at its base URL.

## Supported Network Config

- `fast-testnet`, `fast-mainnet`
- `arbitrum-sepolia`, `arbitrum`
- `base-sepolia`, `base`
- `ethereum`

Do not claim arbitrary network support just because the utility layer has a fallback config.

## Good Fit

Use this package when:

- the user owns the API
- the user wants Express middleware or low-level 402 helpers
- the task is about route protection, pricing, or creating payment requirements
