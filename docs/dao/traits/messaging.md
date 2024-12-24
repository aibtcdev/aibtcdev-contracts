# Messaging Trait

The messaging trait defines the interface for sending on-chain messages up to 1MB in size.

## Interface

```clarity
(define-trait messaging (
  (send ((string-ascii 1048576) bool) (response bool uint))
))
```

## Functions

### send
Sends an on-chain message.
- Parameters:
  - `message`: ASCII message content (max 1MB)
  - `isFromDao`: Whether message is from DAO
- Access: Public for regular messages, DAO/extension only for DAO messages
- Returns: Success/failure response

## Implementation Requirements

1. Validate message size (≤ 1MB)
2. Enforce DAO authorization for DAO messages
3. Track message history
4. Handle message encoding
5. Emit message events

## Usage Pattern

Implementations should:
1. Verify message size
2. Check authorization for DAO messages
3. Log message details
4. Handle errors gracefully

Example implementation:
```clarity
(define-public (send (message (string-ascii 1048576)) (isFromDao bool))
  (begin
    ;; Check DAO authorization if needed
    (if isFromDao
      (try! (is-dao-or-extension))
      true
    )
    
    ;; Log message
    (print {
      notification: "message-sent",
      payload: {
        sender: tx-sender,
        isFromDao: isFromDao,
        message: message
      }
    })
    
    (ok true)
  )
)
```
