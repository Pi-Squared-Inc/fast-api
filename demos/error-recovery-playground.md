# Error Recovery Playground Implementation

## Goal
Teach resilient agent integration by showing real `MoneyError` patterns and concrete remediation steps.

## Route
- Proposed route: `/errors`

## Core User Stories
- User picks a failure scenario.
- User runs operation and sees structured error output.
- User sees next-step recovery code and can retry.

## Page Layout
- Left column: Human Flow
  - Scenario selector
  - Run scenario button
  - Error output viewer (`code`, `message`, `note`)
  - Retry panel with adjusted inputs
- Right column: Agent Flow
  - Scenario-specific request snippets
  - Expected failure response shape
  - Recommended recovery sequence snippet

## Scenarios
1. Missing chain setup -> `CHAIN_NOT_CONFIGURED`
2. Invalid address format -> `INVALID_ADDRESS`
3. Insufficient balance -> `INSUFFICIENT_BALANCE`
4. Mainnet-only swap constraint -> `UNSUPPORTED_OPERATION`
5. Invalid params -> `INVALID_PARAMS`

## Action Card Example (Agent Flow Panel)
### Scenario: Chain Not Configured
- Failing request:
```js
await money.balance({ chain: "base", network: "mainnet" });
```
- Expected error shape:
```json
{
  "code": "CHAIN_NOT_CONFIGURED",
  "message": "Chain \"base\" is not configured.",
  "note": "Run setup first: await money.setup({ chain: \"base\", network: \"mainnet\" })"
}
```
- Recovery sequence:
```js
await money.setup({ chain: "base", network: "mainnet" });
await money.balance({ chain: "base", network: "mainnet" });
```

## UI State Model
- `idle`, `running`, `failed`, `recovered`

## Implementation Steps
1. Build scenario catalog with input presets.
2. Execute scenario and capture structured error fields.
3. Render guided recovery snippet and retry action.
4. Add agent action cards per scenario.

## Acceptance Criteria
- Every scenario shows exact `code/message/note` outputs.
- Recovery snippet can be copied and rerun.
- Agent panel makes retry logic explicit and deterministic.
