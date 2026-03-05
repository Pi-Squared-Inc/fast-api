# Payment Link Lifecycle Dashboard Implementation

## Goal
Demonstrate payment request generation and local lifecycle tracking for agent payer/receiver coordination.

## Route
- Proposed route: `/payment-links`

## Core User Stories
- User creates payment link with chain/amount/receiver.
- User previews generated `/api/pay` request URL.
- User tracks created/paid events and filters by id/chain/direction.

## Page Layout
- Left column: Human Flow
  - Link creation form
  - Latest link preview
  - Tracking table with filters
- Right column: Agent Flow
  - SDK cards for create/list link
  - HTTP card for `/api/pay` request URL
  - Example markdown response snippet

## Action Cards (Agent Flow Panel)

### Action: Create Payment Link
- SDK method: `money.createPaymentLink(...)`
- Example request:
```js
await money.createPaymentLink({
  receiver: "set1...",
  amount: 10,
  chain: "fast",
  network: "testnet",
  memo: "intent:abc"
});
```
- Success response shape:
```json
{
  "url": "https://.../api/pay?receiver=...",
  "payment_id": "pay_...",
  "chain": "fast",
  "amount": "10"
}
```

### Action: List Payment Links
- SDK method: `money.listPaymentLinks(...)`
- Example request:
```js
await money.listPaymentLinks({ chain: "fast", direction: "created", limit: 20 });
```
- Success response shape:
```json
{ "entries": [{ "payment_id": "pay_...", "direction": "created", "chain": "fast" }] }
```

### Action: Fetch Payment Markdown
- Endpoint: `GET /api/pay`
- Example URL:
```text
/api/pay?receiver=set1...&amount=10&chain=fast&token=SET&network=testnet&memo=intent:abc
```
- Success: markdown body with YAML frontmatter (`type: payment_request`)

## UI State Model
- `idle`, `creating`, `created`, `loading_links`, `ready`, `error`

## Implementation Steps
1. Build create form and URL preview card.
2. Build links table with filter controls.
3. Add markdown preview modal for `/api/pay` response.
4. Add agent action cards with copy helpers.

## Acceptance Criteria
- Create/list flow works from same page.
- `/api/pay` markdown preview is visible.
- Agent panel includes both SDK and HTTP integration examples.
