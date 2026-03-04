# Payment Verified -> Unlock Data Plan

## Goal
Implement a production-grade flow where:
1. Merchant publishes a paid data product (example: "$5 USDC").
2. Buyer (human or AI agent) pays on-chain.
3. Backend verifies payment server-side.
4. Buyer receives time-limited access to protected data.

## Scope

### In scope
- Human and AI-agent senders.
- Human and AI-agent receivers (merchant/service backend).
- On-chain verification for USDC payments.
- Access gating via signed unlock tokens.
- Durable intent/payment storage.

### Out of scope (initial release)
- Yield/lending/staking.
- Cross-chain settlement in one intent.
- Arbitrary token support without allowlisting.
- Decentralized, non-custodial merchant receiver management.

## Current State (Gap)
- `money.createPaymentLink()` and `/api/pay` produce payment instructions.
- SDK payment-link tracking is local CSV bookkeeping (`created`/`paid`).
- Demo intent flow (`app/lib/demo/*`) has useful state-machine patterns, but is not production durable/hardened.
- There is no production API today that enforces `payment verified` before `data unlock`.

## Product Behavior

### Buyer-facing behavior
1. Open a product link.
2. Receive an intent with:
   - amount/token/chain/network,
   - unique receiver address,
   - expiry and intent ID.
3. Pay with wallet or agent.
4. Poll status until `settled`.
5. Request unlock token.
6. Fetch protected data using token.

### Merchant/service behavior
1. Create and manage products.
2. Track intents and settlements.
3. Control token/chain allowlist.
4. Audit delivery events and payment proofs.

## Architecture

### New app modules
- `app/lib/paywall/types.ts`
- `app/lib/paywall/store.ts`
- `app/lib/paywall/service.ts`
- `app/lib/paywall/verifier.ts`
- `app/lib/paywall/unlock-token.ts`

### New API routes
- `POST /api/paywall/products`
- `GET /api/paywall/products`
- `GET /api/paywall/products/[slug]`
- `POST /api/paywall/intents`
- `GET /api/paywall/intents/[intentId]`
- `GET /api/paywall/intents/[intentId]/status`
- `POST /api/paywall/intents/[intentId]/unlock`
- `GET /api/paywall/data/[assetId]` (requires unlock token)

### Optional UI routes
- `app/paywall/[slug]/page.tsx` (human checkout/status page)
- Merchant management panel extensions (optional in phase 1)

## Data Model (Durable)

Use durable storage (not in-memory global maps). Keep store behind an interface to allow swapping persistence backend.

### Product
- `product_id` (string)
- `slug` (unique)
- `title`
- `description`
- `asset_id` (what to unlock)
- `chain` (e.g., `base`)
- `network` (`mainnet` for real money)
- `token_address` (USDC contract)
- `token_symbol` (`USDC`)
- `decimals` (6)
- `amount_raw` (string bigint)
- `is_active`
- `created_at`, `updated_at`

### PaymentIntent
- `intent_id` (string)
- `product_id`
- `buyer_id` (cookie session, wallet hint, or anonymous ID)
- `status` (`pending_payment | settled | expired | failed | delivered`)
- `receiver_address` (unique per intent)
- `receiver_account_id`
- `chain`, `network`, `token_address`, `decimals`
- `requested_amount_raw`
- `paid_amount_raw` (running total)
- `created_at`, `expires_at`, `settled_at`, `delivered_at`
- `start_block` (for log scan lower bound)
- `last_scanned_block`

### PaymentEvent
- `event_id`
- `intent_id`
- `kind` (`transfer_seen | settled | expired | unlock_issued | unlock_used | failed`)
- `tx_hash`
- `log_index`
- `block_number`
- `amount_raw`
- `details_json`
- `created_at`

Unique constraint: `(tx_hash, log_index)` for idempotency.

### UnlockGrant
- `grant_id`
- `intent_id`
- `asset_id`
- `token_hash` (store hash only, not plaintext token)
- `expires_at`
- `used_at`
- `created_at`

## Receiver Address Strategy

For ERC-20 attribution, use one unique receiver address per intent.

MVP approach:
- Generate custodial EVM account per intent (or lease from a pre-generated pool).
- Store key material server-side in a restricted location.
- Optional follow-up: periodic sweeper to move funds from receiver addresses to treasury.

Rationale:
- ERC-20 transfers do not carry reliable memo fields.
- Shared receiver addresses make attribution ambiguous.

## Verification Pipeline

### Verifier loop
- Poll every `N` seconds (start with 5s in-app timer, move to queue/cron later).
- For each active intent:
  1. Check expiry.
  2. Query token `Transfer` logs where `to == receiver_address`.
  3. Scan from `start_block + 1` to `latest_safe_block`.
  4. Sum net amount for matching events.
  5. Mark settled when `paid_amount_raw >= requested_amount_raw`.

### Confirmation policy
- `latest_safe_block = latest - confirmations_required`.
- Configurable by chain (example Base mainnet: 3 confirmations for MVP).

### Source of truth
- Chain data is authoritative.
- Client-submitted tx hash is advisory only.

## Unlock Token Design

Issue short-lived signed unlock tokens only after `status == settled`.

Token claims:
- `grant_id`
- `intent_id`
- `asset_id`
- `exp`
- `sub` (buyer/session identifier)

Rules:
- TTL default: 10 minutes.
- One-time use for direct data download endpoints (mark `used_at` atomically).
- Return `403` for invalid/expired/used tokens.

## API Contract (MVP)

### Create intent
`POST /api/paywall/intents`
- Input: `productSlug`
- Output: `intentId`, payment params, human checkout URL, agent payment URL.

### Check status
`GET /api/paywall/intents/:intentId/status`
- Output: `status`, `paidAmount`, `requestedAmount`, `expiresAt`.

### Unlock
`POST /api/paywall/intents/:intentId/unlock`
- Preconditions: settled.
- Output: `{ unlockToken, expiresAt }`

### Access data
`GET /api/paywall/data/:assetId`
- Requires `Authorization: Bearer <unlockToken>` (or signed query token).
- Returns protected payload when authorized.

## Human + Agent Flow Mapping

### Human sender -> merchant receiver
- Human opens checkout page, pays with wallet.
- UI polls `/status`, then calls `/unlock`, then fetches `/data/:assetId`.

### AI agent sender -> merchant receiver
- Agent consumes payment request (or intent payload), calls `money.send(...)`.
- Agent polls `/status`.
- On settled, agent calls `/unlock` then `/data/:assetId`.

### Human receiver / AI receiver
- Receiver role is the merchant backend (not a person wallet UI).
- Merchant ops can be human dashboard actions or automated agent workflows.

## Security Requirements
- Never expose private keys; keep keyfile protections consistent with SDK invariants.
- Strict allowlist for chain + token contracts.
- Validate all request inputs with zod.
- Signed token secret must come from env and be rotated safely.
- Webhook/event ingestion (if added) must verify signatures and enforce idempotency.
- Rate-limit unlock and data endpoints.
- Audit logs for intent transitions and token issuance/use.

## Implementation Phases

### Phase 1: MVP (Base mainnet + USDC only)
- Add durable models and store interface.
- Add product + intent APIs.
- Add verifier loop for USDC `Transfer` logs.
- Add unlock-token issue/validate path.
- Add protected data endpoint.
- Add minimal human checkout page for status + unlock.

### Phase 2: Operational Hardening
- Background worker (queue/cron) instead of in-process timer.
- Receiver wallet pool + treasury sweep job.
- Better failure handling/retries and dead-letter logging.
- Merchant dashboard metrics.

### Phase 3: Expansion
- Additional chains/tokens via allowlists.
- Optional provider/webhook integrations.
- Agent-first endpoint ergonomics (machine-readable status/errors).

## Test Plan

### Unit tests
- Amount parsing and bigint comparisons.
- Status transitions (`pending -> settled -> delivered/expired`).
- Unlock token sign/verify/expiry/one-time-use.
- Idempotent event ingestion (`tx_hash + log_index` uniqueness).

### Integration tests
- Create product -> create intent -> simulate payment -> verify settled -> unlock -> fetch data.
- Underpayment and overpayment behavior.
- Expired intent cannot unlock.
- Invalid token cannot access data.

### Regression checks
- Existing `/api/pay` and SDK payment-link flows unchanged.
- Demo routes continue to work independently.

## Open Questions
1. Which durable store to use first (SQLite, Postgres, managed DB)?
2. Required confirmation count per chain for settlement finality?
3. Receiver custody model: per-intent generated keys vs pre-funded address pool?
4. Should unlock be one-time only or reusable within TTL per buyer?
5. How should data payloads be stored/served (inline, file store, object storage)?

## Acceptance Criteria
1. A product can require exactly `$5 USDC` (raw amount with 6 decimals).
2. Payment is verified server-side from chain data before unlock.
3. Unlock token is short-lived and cannot be reused after one-time consumption (if one-time mode enabled).
4. Human and AI sender flows both succeed against the same backend contract.
5. No unlock occurs for unpaid, underpaid, expired, or failed intents.
