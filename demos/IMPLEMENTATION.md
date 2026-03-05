# Demos Implementation Plan

## Goal
Ship a demo suite that showcases agent-first capabilities end-to-end, similar to existing Merchant and Pay demos, while making the agent integration path visible in every UI.

## Demo Routes and Scope

### 1) Paywall Studio
- Proposed route: `/paywall`
- Purpose: Full payment-verified unlock flow.
- Core flow:
  - Create/list products.
  - Create intent.
  - Display payment request URL (`/api/pay?...`).
  - Poll status (`/api/paywall/intents/:intentId/status`).
  - Request unlock token (`/api/paywall/intents/:intentId/unlock`).
  - Fetch protected asset (`/api/paywall/data/:assetId` with bearer token).
- APIs involved:
  - `POST /api/paywall/products`
  - `GET /api/paywall/products`
  - `POST /api/paywall/intents`
  - `GET /api/paywall/intents/:intentId/status`
  - `POST /api/paywall/intents/:intentId/unlock`
  - `GET /api/paywall/data/:assetId`

### 2) Swap + Quote Terminal
- Proposed route: `/swap`
- Purpose: Agent quote/decision then execution flow.
- Core flow:
  - Input chain, token pair, amount, slippage.
  - Preview quote.
  - Execute swap.
  - Show tx hash/explorer and local history update.
- SDK involved:
  - `money.quote(...)`
  - `money.swap(...)`

### 3) Bridge Console
- Proposed route: `/bridge`
- Purpose: Cross-chain transfer with provider/network behavior visibility.
- Core flow:
  - Configure source/destination chain and token.
  - Preview bridge provider and constraints.
  - Execute bridge and show status timeline.
- SDK involved:
  - `money.bridge(...)`

### 4) Signature Lab
- Proposed route: `/sign`
- Purpose: Message signature auth pattern for agents.
- Core flow:
  - Create challenge message.
  - Sign on selected chain.
  - Verify signature with address.
  - Show chain-specific signature format notes.
- SDK involved:
  - `money.sign(...)`
  - `money.verifySign(...)`

### 5) Token Discovery + Alias Manager
- Proposed route: `/tokens`
- Purpose: Show token discovery + alias registration.
- Core flow:
  - Discover wallet tokens.
  - Register alias.
  - Resolve alias via lookup.
  - Re-check balance/send-ready token identity.
- SDK involved:
  - `money.tokens(...)`
  - `money.registerToken(...)`
  - `money.getToken(...)`

### 6) Payment Link Lifecycle Dashboard
- Proposed route: `/payment-links`
- Purpose: Request creation and lifecycle tracking for payer/receiver coordination.
- Core flow:
  - Create payment link.
  - Copy URL and preview markdown request.
  - View `created`/`paid` events and filtering.
- SDK/API involved:
  - `money.createPaymentLink(...)`
  - `money.listPaymentLinks(...)`
  - `GET /api/pay`

### 7) Custom Chain Builder
- Proposed route: `/chains/custom`
- Purpose: Runtime EVM chain extensibility demo.
- Core flow:
  - Register custom chain.
  - Setup wallet.
  - Run basic balance/send smoke flow.
- SDK involved:
  - `money.registerEvmChain(...)`
  - `money.setup(...)`
  - `money.balance(...)`
  - `money.send(...)`

### 8) Provider Control Plane
- Proposed route: `/providers`
- Purpose: Show pluggable provider architecture.
- Core flow:
  - Show registered swap/bridge/price providers.
  - Set API keys (e.g., Jupiter).
  - Show provider selected for a given operation.
- SDK involved:
  - `money.providers()`
  - `money.setApiKey(...)`

### 9) Address + Units Utility
- Proposed route: `/utils`
- Purpose: Deterministic preflight checks for agents.
- Core flow:
  - Identify candidate chains from address.
  - Convert human <-> raw units.
  - Show token-decimals implications.
- SDK involved:
  - `money.identifyChains(...)`
  - `money.toRawUnits(...)`
  - `money.toHumanUnits(...)`

### 10) Error Recovery Playground
- Proposed route: `/errors`
- Purpose: Teach agent-safe retries and guided remediation.
- Core flow:
  - Trigger representative errors.
  - Show `code`, `message`, `note`.
  - Show next-step action patterns.
- SDK involved:
  - Multiple methods via controlled invalid inputs.

## Shared UI Requirement: Agent Flow Panel (All Demos)
Each demo page should include two side-by-side panels:

- Human Flow panel
  - What a human clicks in this UI.
  - Current state/status summary.

- Agent Flow panel
  - Exact endpoint or SDK call the agent should use.
  - Ready-to-copy request shape.
  - Expandable example response.
  - Error response example with recovery hints.

## Agent Flow Panel Content Spec
For every action card (for example, “Create Intent”, “Pay”, “Unlock”), include:

1. Action title
- Example: `Create Intent`.

2. Integration mode
- `HTTP endpoint` or `SDK method`.

3. Request reference
- URL, method, headers, and JSON body (or SDK snippet).

4. Example success response
- Realistic JSON from the current API contract.

5. Example failure responses
- At least one likely failure case.
- Include expected status code and payload shape.

6. Copy helpers
- Copy URL button.
- Copy cURL button.
- Copy JS snippet button.

7. “Try it” control (optional per page)
- Sends sample request against local API and renders response.

## API Example UX Pattern
- Default collapsed block for request and response examples.
- One-click expand for full payload.
- Toggle tabs: `cURL`, `JavaScript`, `Raw JSON`.
- Clearly label environment assumptions (for example, testnet/mainnet).
- Include field-level notes for required params.

## Suggested Build Order
1. Paywall Studio
2. Payment Link Lifecycle Dashboard
3. Swap + Quote Terminal
4. Bridge Console
5. Signature Lab
6. Token Discovery + Alias Manager
7. Provider Control Plane
8. Custom Chain Builder
9. Address + Units Utility
10. Error Recovery Playground

## Folder Plan
- This file is the index: `demos/IMPLEMENTATION.md`
- Later add one file per demo:
  - `demos/paywall-studio.md`
  - `demos/swap-quote-terminal.md`
  - `demos/bridge-console.md`
  - `demos/signature-lab.md`
  - `demos/token-discovery-alias-manager.md`
  - `demos/payment-link-lifecycle-dashboard.md`
  - `demos/custom-chain-builder.md`
  - `demos/provider-control-plane.md`
  - `demos/address-units-utility.md`
  - `demos/error-recovery-playground.md`

## Existing Demo Enhancement Plans
- `demos/merchant-agent-api-panel.md`
  - Add an agent-facing API example panel next to `Merchant: Create Intent` on `/merchant`.
