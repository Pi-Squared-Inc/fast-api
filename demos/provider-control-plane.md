# Provider Control Plane Implementation

## Goal
Expose provider registry and API-key configuration so users can see how agent routing is determined.

## Route
- Proposed route: `/providers`

## Core User Stories
- User lists swap/bridge/price providers.
- User sets provider API key (e.g., Jupiter).
- User tests operation and sees selected provider.

## Page Layout
- Left column: Human Flow
  - Providers registry tables (swap/bridge/price)
  - API key set form
  - Test operation panel (quote/price)
- Right column: Agent Flow
  - SDK cards for `providers` and `setApiKey`
  - Test snippets that show provider selection in outputs

## Action Cards (Agent Flow Panel)

### Action: List Providers
- SDK method: `money.providers()`
- Example response shape:
```json
{
  "swap": [{ "name": "jupiter", "chains": ["solana"] }],
  "bridge": [{ "name": "debridge", "chains": ["ethereum", "base", "solana"] }],
  "price": [{ "name": "dexscreener", "chains": ["ethereum", "base"] }]
}
```

### Action: Set API Key
- SDK method: `money.setApiKey(...)`
- Example request:
```js
await money.setApiKey({ provider: "jupiter", apiKey: "your-key" });
```
- Common failure:
```json
{ "code": "INVALID_PARAMS", "message": "Missing required param: apiKey" }
```

## UI State Model
- `idle`, `loading`, `saving_key`, `saved`, `error`

## Implementation Steps
1. Build provider tables from `money.providers()` output.
2. Add API key form and masked value UX.
3. Add test call panel that surfaces provider used in result.
4. Add agent action cards.

## Acceptance Criteria
- Registry data is clearly grouped by provider type.
- API key save flow is explicit and validated.
- Agent panel shows copyable calls and expected response structures.
