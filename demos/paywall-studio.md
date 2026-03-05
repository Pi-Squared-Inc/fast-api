# Paywall Studio Implementation

## Goal
Provide a full "payment verified -> unlock data" demo with both human workflow and agent integration details visible on the same screen.

## Route
- Primary route: `/paywall`
- Existing checkout detail route to reuse: `/paywall/[slug]`

## Core User Stories
- Merchant creates a product with locked content.
- Buyer (or agent) creates an intent.
- Buyer pays using generated payment request.
- System verifies settlement.
- Buyer requests unlock grant and fetches protected asset.

## Page Layout
- Left column: Human Flow
  - Product creation form
  - Product list and selected product details
  - Intent list with status timeline
  - Unlock + data fetch controls
- Right column: Agent Flow
  - API action cards for each step
  - Expandable request/response examples
  - Copy buttons for URL, cURL, JSON, JS fetch snippet

## Action Cards (Agent Flow Panel)

### Action: Create Product
- Endpoint: `POST /api/paywall/products`
- Request body:
```json
{
  "title": "Pro Research Report",
  "description": "Unlocks a JSON payload",
  "amount": "5",
  "assetData": { "report": "alpha" }
}
```
- Success response shape:
```json
{ "product": { "productId": "...", "slug": "pro-research-report", "amount": "5" } }
```
- Common failure:
```json
{ "error": "Product slug \"pro-research-report\" already exists.", "code": "CONFLICT" }
```

### Action: Create Intent
- Endpoint: `POST /api/paywall/intents`
- Request body:
```json
{
  "productSlug": "pro-research-report",
  "expiryMinutes": 15
}
```
- Success response shape:
```json
{
  "intent": { "intentId": "intent_...", "status": "pending_payment" },
  "product": { "slug": "pro-research-report" },
  "paymentRequestUrl": "https://.../api/pay?...",
  "statusUrl": "https://.../api/paywall/intents/intent_.../status",
  "unlockUrl": "https://.../api/paywall/intents/intent_.../unlock"
}
```
- Common failure:
```json
{ "error": "Product not found.", "code": "NOT_FOUND" }
```

### Action: Poll Intent Status
- Endpoint: `GET /api/paywall/intents/:intentId/status`
- Success response shape:
```json
{
  "intent": { "intentId": "intent_...", "status": "pending_payment", "paidAmount": "0" },
  "canUnlock": false
}
```

### Action: Request Unlock Grant
- Endpoint: `POST /api/paywall/intents/:intentId/unlock`
- Request body:
```json
{ "buyerId": "buyer_..." }
```
- Success response shape:
```json
{
  "intent": { "intentId": "intent_...", "status": "settled" },
  "unlockToken": "...",
  "expiresAt": "...",
  "assetId": "asset_...",
  "dataUrl": "https://.../api/paywall/data/asset_..."
}
```
- Common failure:
```json
{ "error": "Intent is pending_payment. Payment must be settled before unlock.", "code": "INTENT_NOT_SETTLED" }
```

### Action: Fetch Protected Data
- Endpoint: `GET /api/paywall/data/:assetId`
- Header: `Authorization: Bearer <unlockToken>`
- Success: raw asset payload (`application/json` or `text/plain`)
- Common failure:
```json
{ "error": "Unlock token already used.", "code": "FORBIDDEN" }
```

## Optional Advanced Card
### Action: Apply Webhook Event
- Endpoint: `POST /api/paywall/webhooks/:provider`
- Purpose: demo idempotency and external settlement integration
- Requires signed payload headers

## UI State Model
- Product states: `loading`, `ready`, `create_error`
- Intent states: `pending_payment`, `settled`, `expired`, `failed`, `delivered`
- Unlock states: `idle`, `grant_issued`, `token_used`, `token_expired`

## Implementation Steps
1. Add new `app/paywall/page.tsx` as control center with product + intent management.
2. Reuse existing `/paywall/[slug]` components for checkout details where possible.
3. Add shared `ApiActionCard` component for request/response examples and copy actions.
4. Add polling loop for status updates with visible refresh timestamp.
5. Add unlock + data fetch panel with one-time token behavior explained.
6. Add webhook simulation section behind explicit dev toggle.

## Acceptance Criteria
- Merchant can complete full flow without leaving paywall surfaces.
- Every human action has a corresponding agent action card.
- Success and failure response examples are visible and copyable.
- Unlock token single-use behavior is clearly demonstrated.
