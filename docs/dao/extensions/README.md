# DAO Extensions

Extensions are modular components that add functionality to the DAO. Each extension implements specific traits and can only be called by the DAO or other enabled extensions.

## Available Extensions

- [Actions](aibtc-ext001-actions.md) - Voting on predefined actions
- [Bank Account](aibtc-ext002-bank-account.md) - Managed STX withdrawals
- [Direct Execute](aibtc-ext003-direct-execute.md) - Voting on arbitrary code execution
- [Messaging](aibtc-ext004-messaging.md) - On-chain messaging up to 1MB
- [Payments](aibtc-ext005-payments.md) - Payment processing for DAO services with invoicing
- [Treasury](aibtc-ext006-treasury.md) - Multi-asset treasury management (STX, NFTs, FTs)

## Extension Architecture

Each extension:

1. Implements the base extension trait
2. Implements additional specialized traits
3. Uses a unique error code range
4. Can only be called by the DAO or other extensions
5. Can request callbacks from other extensions

## Common Patterns

### Authorization Check

All extensions use this pattern to verify calls:

```clarity
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
```

### Callback Support 

Extensions implement a callback function:

```clarity
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
```

### Event Logging

Extensions log events with consistent format:

```clarity
(print {
  notification: "event-name",
  payload: {
    key1: value1,
    key2: value2
  }
})
```

## Adding New Extensions

To add a new extension:

1. Create contract implementing required traits
2. Use unique error code range
3. Add authorization checks
4. Implement callback support
5. Add to bootstrap proposal
