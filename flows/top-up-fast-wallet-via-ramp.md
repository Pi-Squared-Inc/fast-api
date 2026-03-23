# Top Up Fast Wallet Via Hosted Ramp

Use this flow when the user needs more Fast-side USDC for the next step and already has a known
`fast1...` address.

## Trigger

Offer this when:

- the next action requires Fast-side USDC or `fastUSDC`
- the current Fast balance is insufficient for that action
- the user can open a browser and complete a hosted payment flow

Do not use this flow if the Fast address is unknown or if the user asked for a code-level bridge
implementation instead of an interactive top-up path.

## Link Contract

Base URL:

```text
https://ramp.fast.xyz/usdc
```

Parameters:

- `to`: required Fast destination address
- `amount`: optional USD prefill

Examples:

```text
https://ramp.fast.xyz/usdc?to=fast1...
https://ramp.fast.xyz/usdc?to=fast1...&amount=25
```

## Agent Behavior

1. Confirm or derive the user's Fast address.
2. If you know a reasonable user-facing top-up amount in USD, include `amount`.
3. Tell the user to open the hosted ramp link and complete the payment in the browser.
4. Do not claim the agent can complete KYC, card entry, or the purchase itself.
5. After the user says they are done, re-check the Fast balance before proceeding.

## Messaging Guidance

Keep the language simple and operational:

- say the link tops up Fast-side USDC to their `fast1...` wallet
- make it explicit that `amount` is a USD prefill, not a token amount
- tell the user to come back after the payment completes

## Example Response

```text
Your Fast-side USDC balance is too low for the next step.

Top up here:
https://ramp.fast.xyz/usdc?to=fast1...&amount=25

That link prefills your Fast address and a USD amount. Complete the purchase in the browser, then tell me when you're done and I'll re-check your balance before continuing.
```

## Checks

- `to` must be a valid `fast1...` address
- `amount` is a USD prefill; omit it if you do not have a clear amount
- always re-check balance after the user returns
