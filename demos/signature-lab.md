# Signature Lab Implementation

## Goal
Show message signing and verification flows for agent auth/proof use cases across chain types.

## Route
- Proposed route: `/sign`

## Core User Stories
- User provides message and chain.
- User signs message and gets signature output.
- User verifies signature against address and message.

## Page Layout
- Left column: Human Flow
  - Message input
  - Chain/network selector
  - Sign output panel
  - Verify panel
- Right column: Agent Flow
  - SDK call cards for `sign` and `verifySign`
  - Signature format notes by chain

## Action Cards (Agent Flow Panel)

### Action: Sign
- SDK method: `money.sign(...)`
- Example request:
```js
await money.sign({ chain: "fast", message: "Sign in: nonce-123" });
```
- Success response shape:
```json
{
  "signature": "...",
  "address": "set1...",
  "chain": "fast",
  "network": "testnet"
}
```

### Action: Verify
- SDK method: `money.verifySign(...)`
- Example request:
```js
await money.verifySign({
  chain: "fast",
  message: "Sign in: nonce-123",
  signature: "...",
  address: "set1..."
});
```
- Success response shape:
```json
{ "valid": true, "address": "set1...", "chain": "fast", "network": "testnet" }
```
- Common failure:
```json
{ "valid": false, "note": "Signature verification failed..." }
```

## UI State Model
- `idle`, `signing`, `signed`, `verifying`, `verified`, `error`

## Implementation Steps
1. Build sign form and output area.
2. Build verify form seeded from prior sign result.
3. Add chain-format helper text (EVM hex, Solana base58, Fast hex).
4. Add agent action cards and copy helpers.

## Acceptance Criteria
- Sign and verify can be run independently.
- Verification failure reasons are shown clearly.
- Agent panel has request + response examples for both actions.
