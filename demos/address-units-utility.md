# Address + Units Utility Implementation

## Goal
Give agents a deterministic preflight utility for address chain detection and amount conversion correctness.

## Route
- Proposed route: `/utils`

## Core User Stories
- User inputs address and sees candidate chain families.
- User converts human value to raw units.
- User converts raw units back to human using token decimals.

## Page Layout
- Left column: Human Flow
  - Address inspector
  - To-raw converter
  - To-human converter
- Right column: Agent Flow
  - SDK cards for `identifyChains`, `toRawUnits`, `toHumanUnits`
  - Failure examples for missing decimals/chain config

## Action Cards (Agent Flow Panel)

### Action: Identify Chains
- SDK method: `money.identifyChains(...)`
- Example request:
```js
await money.identifyChains({ address: "0x1234..." });
```
- Success response shape:
```json
{ "chains": ["base", "ethereum", "arbitrum"], "note": "Multiple chains use this address format..." }
```

### Action: To Raw Units
- SDK method: `money.toRawUnits(...)`
- Example request:
```js
await money.toRawUnits({ amount: "25", token: "USDC", chain: "base", network: "mainnet" });
```
- Success example: `25000000n`

### Action: To Human Units
- SDK method: `money.toHumanUnits(...)`
- Example request:
```js
await money.toHumanUnits({ amount: "25000000", token: "USDC", chain: "base", network: "mainnet" });
```
- Success example: `"25"`

## UI State Model
- `idle`, `resolving`, `converted`, `error`

## Implementation Steps
1. Build address inspector with chain-tag chips.
2. Build to-raw/to-human forms with shared validation.
3. Add result formatting and copy support.
4. Add agent action cards with examples.

## Acceptance Criteria
- Conversion results are reproducible and copyable.
- Address detection notes are visible when ambiguous.
- Agent panel shows clear request patterns for both conversions.
