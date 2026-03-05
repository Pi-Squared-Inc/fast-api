# Token Discovery + Alias Manager Implementation

## Goal
Make token discovery and alias registration explicit so agents can reliably resolve token names for balance/send operations.

## Route
- Proposed route: `/tokens`

## Core User Stories
- User runs token discovery for a chain/network.
- User registers a custom alias.
- User resolves alias and confirms decimals/address.

## Page Layout
- Left column: Human Flow
  - Chain/network selector
  - Discover tokens action
  - Alias registration form
  - Alias lookup view
- Right column: Agent Flow
  - SDK call cards for `tokens`, `registerToken`, `getToken`
  - Request/response examples with decimals focus

## Action Cards (Agent Flow Panel)

### Action: Discover Tokens
- SDK method: `money.tokens(...)`
- Example request:
```js
await money.tokens({ chain: "base", network: "mainnet" });
```
- Success response shape:
```json
{ "chain": "base", "owned": [{ "symbol": "USDC", "address": "0x...", "decimals": 6 }] }
```

### Action: Register Alias
- SDK method: `money.registerToken(...)`
- Example request:
```js
await money.registerToken({
  chain: "base",
  name: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  decimals: 6,
  network: "mainnet"
});
```

### Action: Get Alias
- SDK method: `money.getToken(...)`
- Example request:
```js
await money.getToken({ chain: "base", name: "USDC", network: "mainnet" });
```
- Success response shape:
```json
{ "name": "USDC", "address": "0x...", "decimals": 6 }
```

## UI State Model
- `idle`, `discovering`, `discovered`, `registering`, `registered`, `error`

## Implementation Steps
1. Build token discovery table.
2. Add alias create/edit form.
3. Add alias lookup inspector.
4. Add agent action cards and copy controls.

## Acceptance Criteria
- Discovery results and aliases are visible together.
- Alias decimals and address are easy to confirm.
- Agent panel shows exact calls required for deterministic token resolution.
