# Bridge Console Implementation

## Goal
Demonstrate cross-chain transfers with provider/network constraints, explicit receiver logic, and bridge result tracking.

## Route
- Proposed route: `/bridge`

## Core User Stories
- User selects source/destination chain+token and amount.
- User understands which provider is selected and why.
- User executes bridge and tracks resulting transaction.

## Page Layout
- Left column: Human Flow
  - Source/destination selectors
  - Amount/receiver fields
  - Provider/network compatibility badges
  - Execute + result timeline
- Right column: Agent Flow
  - SDK call card for `bridge`
  - Success/failure examples
  - Notes for receiver defaults and setup requirements

## Action Card (Agent Flow Panel)
### Action: Bridge
- SDK method: `money.bridge(...)`
- Example request:
```js
await money.bridge({
  from: { chain: "fast", token: "SET" },
  to: { chain: "arbitrum", token: "WSET" },
  amount: 10,
  network: "testnet"
});
```
- Success response shape:
```json
{
  "txHash": "...",
  "explorerUrl": "...",
  "fromChain": "fast",
  "toChain": "arbitrum",
  "fromAmount": "10",
  "orderId": "..."
}
```
- Common failures:
```json
{ "code": "UNSUPPORTED_OPERATION", "message": "Bridge provider \"...\" does not support network \"...\"." }
```
```json
{ "code": "CHAIN_NOT_CONFIGURED", "message": "Source chain \"...\" is not configured for ..." }
```

## UI State Model
- `idle`, `validating`, `ready`, `bridging`, `success`, `error`

## Implementation Steps
1. Build chain/token pair selectors with provider validation hints.
2. Add receiver behavior note: explicit receiver vs inferred destination wallet.
3. Add execute panel and result object viewer.
4. Add agent flow card with copy snippets.
5. Add state badges for provider/network chosen.

## Acceptance Criteria
- Invalid bridge combinations are blocked before submit.
- Result includes tx hash + explorer link.
- Agent panel clearly explains required fields and common errors.
