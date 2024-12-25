# Extension Trait

The extension trait defines the base interface that all DAO extensions must implement.

## Interface

```clarity
(define-trait extension (
  (callback (principal (buff 34)) (response bool uint))
))
```

## Functions

### callback
Standard extension callback support.
- Parameters:
  - `sender`: Calling principal
  - `memo`: Optional callback data (34 bytes)
- Returns: Success/failure response

## Implementation Requirements

1. Handle callbacks from DAO and other extensions
2. Process callback memos appropriately
3. Return meaningful success/failure responses
4. Implement authorization checks
5. Log callback events consistently

## Usage Pattern

Extensions should implement callback to:
1. Receive notifications from other extensions
2. Process cross-extension requests
3. Handle DAO-initiated actions
4. Support extension-specific callbacks

Example implementation:
```clarity
(define-public (callback (sender principal) (memo (buff 34)))
  (begin
    ;; Verify sender is DAO or extension
    (try! (is-dao-or-extension))
    
    ;; Process callback
    (print {
      notification: "callback",
      payload: {
        sender: sender,
        memo: memo
      }
    })
    
    (ok true)
  )
)
```
