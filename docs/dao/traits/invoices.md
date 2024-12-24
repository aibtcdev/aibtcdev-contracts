# Invoices Trait

The invoices trait defines the interface for processing payments for resources defined through the resources trait.

## Interface

```clarity
(define-trait invoices (
  (pay-invoice (uint (optional (buff 34))) (response uint uint))
  (pay-invoice-by-resource-name ((string-utf8 50) (optional (buff 34))) (response uint uint))
))
```

## Functions

### Payment Processing

#### pay-invoice
Processes payment for a resource by ID.
- Parameters:
  - `uint`: Resource ID
  - `memo`: Optional payment memo (34 bytes)
- Access: Public
- Returns: Invoice ID on success

#### pay-invoice-by-resource-name
Processes payment for a resource by name.
- Parameters:
  - `name`: Resource name
  - `memo`: Optional payment memo (34 bytes)
- Access: Public
- Returns: Invoice ID on success

## Implementation Requirements

1. Verify resource exists and is enabled
2. Process payment transfer
3. Generate unique invoice ID
4. Track payment status
5. Handle payment memos
6. Emit payment events

## Usage Pattern

Implementations should:
1. Validate resource status
2. Process payment atomically
3. Generate sequential invoice IDs
4. Log payment details

Example implementation:
```clarity
(define-public (pay-invoice-by-resource-name 
    (name (string-utf8 50))
    (memo (optional (buff 34))))
  (let (
    (resource (unwrap! (get-resource-by-name name) ERR_NOT_FOUND))
    (price (get price resource))
  )
    ;; Verify resource enabled
    (asserts! (get enabled resource) ERR_DISABLED)
    
    ;; Process payment
    (try! (stx-transfer? price tx-sender payment-address))
    
    ;; Generate invoice
    (let ((invoice-id (generate-invoice-id)))
      ;; Log payment
      (print {
        notification: "payment-processed",
        payload: {
          resource: name,
          price: price,
          payer: tx-sender,
          invoiceId: invoice-id,
          memo: memo
        }
      })
      
      (ok invoice-id)
    )
  )
)
```
