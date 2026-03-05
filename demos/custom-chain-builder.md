# Custom Chain Builder Implementation

## Goal
Show runtime chain extensibility by registering a custom EVM chain and immediately using it in setup/balance/send flows.

## Route
- Proposed route: `/chains/custom`

## Core User Stories
- User enters custom chain details.
- User registers chain and confirms it appears in runtime config.
- User runs setup/balance/send smoke checks.

## Page Layout
- Left column: Human Flow
  - Register chain form (name, chainId, rpc, explorer, default token, network)
  - Setup/balance/send smoke actions
  - Status output
- Right column: Agent Flow
  - SDK cards for `registerEvmChain`, `setup`, `balance`, `send`
  - Common error examples

## Action Cards (Agent Flow Panel)

### Action: Register Custom Chain
- SDK method: `money.registerEvmChain(...)`
- Example request:
```js
await money.registerEvmChain({
  chain: "my-l2",
  chainId: 12345,
  rpc: "https://rpc.my-l2.io",
  explorer: "https://scan.my-l2.io/tx/",
  defaultToken: "MYC",
  network: "testnet"
});
```
- Common failure:
```json
{ "code": "INVALID_PARAMS", "message": "\"base\" is a built-in chain and cannot be overridden." }
```

### Action: Setup/Balance/Send Smoke
- SDK methods:
```js
await money.setup({ chain: "my-l2", network: "testnet" });
await money.balance({ chain: "my-l2", network: "testnet" });
await money.send({ chain: "my-l2", to: "0x...", amount: "0.01", network: "testnet" });
```

## UI State Model
- `idle`, `registering`, `registered`, `smoke_running`, `success`, `error`

## Implementation Steps
1. Build custom-chain form and validation.
2. Add smoke test panel with one-click run sequence.
3. Show result logs per step.
4. Add agent action cards for each operation.

## Acceptance Criteria
- New chain can be registered without app restart.
- Smoke flow reflects real runtime behavior and failures.
- Agent panel exposes exact code required to reproduce flow.
