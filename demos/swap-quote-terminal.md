# Swap + Quote Terminal Implementation

## Goal
Show agent decision flow: quote first, inspect risk fields, then execute swap with explicit parameters.

## Route
- Proposed route: `/swap`

## Core User Stories
- User inputs chain, token pair, amount, slippage.
- User previews quote and provider before execution.
- User executes swap and sees transaction evidence.

## Page Layout
- Left column: Human Flow
  - Form for chain/from/to/amount/slippage/network
  - Quote preview card
  - Execute button and tx result
- Right column: Agent Flow
  - SDK call cards for `quote` and `swap`
  - Request snippets and sample responses
  - Failure examples for unsupported network/provider/token

## Action Cards (Agent Flow Panel)

### Action: Quote
- SDK method: `money.quote(...)`
- Example request:
```js
await money.quote({
  chain: "ethereum",
  from: "ETH",
  to: "USDC",
  amount: 0.5,
  network: "mainnet",
  slippageBps: 50
});
```
- Success response shape:
```json
{
  "fromToken": "ETH",
  "toToken": "USDC",
  "fromAmount": "0.5",
  "toAmount": "...",
  "rate": "1 ETH = ... USDC",
  "priceImpact": "...",
  "provider": "paraswap"
}
```
- Common failure:
```json
{ "code": "UNSUPPORTED_OPERATION", "message": "Swap/quote requires mainnet." }
```

### Action: Swap
- SDK method: `money.swap(...)`
- Example request:
```js
await money.swap({
  chain: "ethereum",
  from: "ETH",
  to: "USDC",
  amount: 0.5,
  network: "mainnet",
  slippageBps: 50
});
```
- Success response shape:
```json
{
  "txHash": "0x...",
  "explorerUrl": "https://...",
  "fromToken": "ETH",
  "toToken": "USDC",
  "provider": "paraswap"
}
```
- Common failure:
```json
{ "code": "CHAIN_NOT_CONFIGURED", "message": "Chain \"ethereum\" is not configured for mainnet." }
```

## UI State Model
- `idle`, `quoting`, `quoted`, `swapping`, `success`, `error`

## Implementation Steps
1. Build route and form with strict validation.
2. Add quote card with diff against previous quote.
3. Add execute path that requires quote preview first.
4. Add tx card with explorer link and local history echo.
5. Add reusable `SdkActionCard` panel entries for quote/swap.

## Acceptance Criteria
- Quote can be run independently.
- Swap requires explicit `network: "mainnet"` in UI.
- Agent panel provides copyable SDK request and response examples.
