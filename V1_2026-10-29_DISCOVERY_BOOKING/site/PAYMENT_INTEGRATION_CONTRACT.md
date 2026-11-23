# Future payment integration contract

V1 processes no real payment. Production uses `PAYMENT_MODE=disabled`; public programme actions are enquiries unless an approved future integration changes that behavior.

## Content-facing commerce shape

```json
{
  "enabled": false,
  "mode": "enquiry",
  "currency": "PKR",
  "amount": null,
  "label": "Enquire"
}
```

Allowed modes are `enquiry`, `registration` and `ticket`. An occurrence owns dated availability; a programme owns the durable description.

## Adapter boundary

A future provider adapter should accept an occurrence ID, quantity, currency, amount and an opaque customer/session reference. The server—not the browser—must retrieve the authoritative occurrence and amount, create the provider checkout, verify signed webhooks, and convert provider events into internal order states.

Suggested states: `pending`, `paid`, `declined`, `cancelled`, `refunded` and `expired`. Idempotency keys and verified provider event IDs are required.

## Security rules

- Never store card, bank, CVV, OTP or provider secret data in Virsapur content JSON.
- Secrets must be server-side environment variables.
- Amount and currency must be validated server-side.
- Webhook signatures must be verified before an order changes state.
- Logging must exclude payment credentials and unnecessary personal data.
- Provider terms, tax, refund, privacy and ticketing requirements need a separate operational review.

The Studio checkout is deliberately incompatible with real payment credentials. It records only local demonstration outcomes in `studio-data/mock-orders.json`.
