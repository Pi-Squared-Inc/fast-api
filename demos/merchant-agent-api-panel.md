# Merchant Demo Agent API Panel Plan

## Goal
Add an agent-facing API example panel next to the existing `Merchant: Create Intent` form on `/merchant`, so integrators can see the exact endpoint, request format, and response shapes without leaving the page.

## Scope
- Target UI: `app/merchant/page.tsx`
- Primary action in scope (Phase 1): `Create Intent`
- Primary endpoint in scope (Phase 1): `POST /api/demo/intents`
- Keep existing merchant/buyer demo behavior unchanged.

## Current Behavior
- The page already has a human form for creating intents.
- It already calls `POST /api/demo/intents` via `fetchJson(...)`.
- Intent cards show both human checkout link and `paymentLinkAgent` link after creation.
- There is no inline API example card showing request URL, payload, or expandable response examples.

## API Contract To Surface

### Create Intent Endpoint
- Method: `POST`
- URL: `/api/demo/intents`
- Headers: `Content-Type: application/json`
- Request body fields:
  - `serviceId?: string`
  - `amount?: string | number` (required in practice; API returns error if missing/invalid)
  - `settlementChain?: "fast" | "arbitrum-sepolia"`
  - `expiryMinutes?: number`
  - `buyerSessionId?: string` (optional; cookie session is used when omitted)

Example request body:
```json
{
  "serviceId": "movie tickets",
  "amount": "2",
  "settlementChain": "fast",
  "expiryMinutes": 15
}
```

Example success response shape:
```json
{
  "intent": {
    "intentId": "intent_...",
    "buyerSessionId": "buyer_...",
    "serviceId": "movie tickets",
    "requestedAmount": "2",
    "tokenRequested": "SET",
    "sourceChain": "fast",
    "settlementChain": "fast",
    "receiverAddress": "...",
    "paymentLink": "https://.../merchant/checkout?intentId=...",
    "paymentLinkAgent": "https://.../api/pay?...",
    "expiresAt": "...",
    "status": "pending_payment",
    "createdAt": "...",
    "overpaid": false,
    "events": []
  },
  "session": {
    "sessionId": "buyer_...",
    "addressFast": "...",
    "createdAt": "...",
    "lastSeenAt": "..."
  }
}
```

Example common failures (current API shape):
```json
{ "error": "Amount is required." }
```
```json
{ "error": "Settlement chain must be one of: fast, arbitrum-sepolia." }
```
```json
{ "error": "Buyer session not found. Create a session first." }
```

Note: demo error payloads currently expose `{ "error": string }` without a stable `code`.

## UX Plan (Phase 1)

### Layout
- Convert the current single `Merchant: Create Intent` section to a two-column layout on desktop:
  - Left: existing human form.
  - Right: new `Agent API: Create Intent` card.
- Keep mobile behavior stacked vertically.

### Agent API Card Content
1. Integration mode
- Label: `HTTP endpoint`

2. Request reference
- Show method + URL.
- Show request headers and JSON payload.
- Include a toggle to use:
  - live form values (`serviceId`, `amount`, `settlementChain`), or
  - a static sample payload.

3. Copy helpers
- `Copy URL`
- `Copy cURL`
- `Copy JS fetch`

4. Expandable response examples
- Success response (`<details>` collapsed by default).
- Failure response examples (`<details>` collapsed by default).

5. Optional "Try it" button
- Reuses current API call path and renders JSON result inline.
- Can be deferred if it adds too much coupling with the existing create flow.

## Implementation Plan

1. Add local view-model helpers in `app/merchant/page.tsx`
- Build sample request payload from existing state.
- Build copyable strings for URL/cURL/JS.

2. Add `AgentApiCard` UI (inline component or local subcomponent)
- Keep styles consistent with current inline-style approach.
- Use `<details>` for expandable request/response blocks.

3. Restructure `Merchant: Create Intent` section layout
- Wrap current form + new card in responsive grid/flex:
  - desktop: two columns
  - narrow screens: single column

4. Wire copy actions
- Use `navigator.clipboard.writeText(...)`.
- Add lightweight copied-state feedback per button.

5. Populate response examples
- Static JSON examples based on the real route contract.
- Optionally show last real create-intent API response as "Last live response".

6. Preserve existing flows
- Keep `createIntent()` behavior unchanged.
- Keep tour highlighting targets intact (`serviceInputRef`, `amountInputRef`, `createButtonRef`).

## Phase 2 (Optional Extension)
- Add per-intent action cards for:
  - `POST /api/demo/intents/:intentId/pay`
  - `POST /api/demo/intents/:intentId/deliver`
- Include intent-scoped sample requests and status transition notes.

## Acceptance Criteria
1. `/merchant` shows an agent API card next to `Merchant: Create Intent` on desktop and stacked on mobile.
2. Card shows endpoint method + URL, request payload, and expandable success/failure examples.
3. URL/cURL/JS copy controls work in browser.
4. Existing intent creation UX and tour flow still work.
5. No API behavior changes are required for Phase 1.

## Validation Checklist
- Run app: `npm run dev`
- Verify at `/merchant`:
  - section renders in 2-column desktop / 1-column mobile
  - copy buttons place expected text on clipboard
  - example response blocks expand/collapse
  - creating intent still updates intent list as before
