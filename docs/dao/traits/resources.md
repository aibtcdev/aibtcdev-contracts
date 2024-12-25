# Resources Trait

The resources trait defines the interface for managing payable resources with configurable pricing and descriptions.

## Interface

```clarity
(define-trait resources (
  (set-payment-address (principal) (response bool uint))
  (add-resource ((string-utf8 50) (string-utf8 255) uint (optional (string-utf8 255))) (response uint uint))
  (toggle-resource (uint) (response bool uint))
  (toggle-resource-by-name ((string-utf8 50)) (response bool uint))
))
```

## Functions

### Configuration

#### set-payment-address
Sets the payment recipient for resource invoices.
- Parameters:
  - `principal`: Payment recipient address
- Access: DAO/extension only
- Returns: Success/failure response

### Resource Management

#### add-resource
Creates a new payable resource.
- Parameters:
  - `name`: Resource name (max 50 chars)
  - `description`: Resource description (max 255 chars)
  - `price`: Price in microSTX
  - `metadata`: Optional additional data (max 255 chars)
- Access: DAO/extension only
- Returns: Resource ID on success

#### toggle-resource
Enables/disables a resource by ID.
- Parameters:
  - `uint`: Resource ID
- Access: DAO/extension only
- Returns: Success/failure response

#### toggle-resource-by-name
Enables/disables a resource by name.
- Parameters:
  - `name`: Resource name
- Access: DAO/extension only
- Returns: Success/failure response

## Implementation Requirements

1. Maintain unique resource names
2. Track resource enabled/disabled status
3. Validate input parameters
4. Enforce DAO/extension-only access
5. Emit events for state changes

## Usage Pattern

Implementations should:
1. Verify resource name uniqueness
2. Validate price > 0
3. Track resource status
4. Log all changes

Example implementation:
```clarity
(define-public (add-resource (name (string-utf8 50)) 
                            (description (string-utf8 255))
                            (price uint)
                            (metadata (optional (string-utf8 255))))
  (begin
    ;; Check authorization
    (try! (is-dao-or-extension))
    
    ;; Validate inputs
    (asserts! (> price u0) ERR_INVALID_PRICE)
    (asserts! (not (resource-exists name)) ERR_NAME_EXISTS)
    
    ;; Save resource
    (try! (save-resource name description price metadata))
    
    ;; Log creation
    (print {
      notification: "resource-added",
      payload: {
        name: name,
        price: price,
        description: description
      }
    })
    
    (ok true)
  )
)
```
