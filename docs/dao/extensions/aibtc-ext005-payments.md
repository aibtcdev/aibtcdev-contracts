# Payments Extension

The payments extension (`aibtc-ext005-payments.clar`) provides payment processing capabilities for aibtcdev services.

## Key Features

- Resource management with pricing
- Invoice generation and tracking
- User payment history
- Revenue tracking
- Configurable payment address

## Error Codes

### Authorization
- `ERR_UNAUTHORIZED (5000)` - Caller not authorized
- `ERR_INVALID_PARAMS (5001)` - Invalid parameters provided

### Resources
- `ERR_NAME_ALREADY_USED (5002)` - Resource name already exists
- `ERR_SAVING_RESOURCE_DATA (5003)` - Error saving resource data
- `ERR_DELETING_RESOURCE_DATA (5004)` - Error deleting resource
- `ERR_RESOURCE_NOT_FOUND (5005)` - Resource does not exist
- `ERR_RESOURCE_DISABLED (5006)` - Resource is disabled

### Users
- `ERR_USER_ALREADY_EXISTS (5007)` - User already registered
- `ERR_SAVING_USER_DATA (5008)` - Error saving user data
- `ERR_USER_NOT_FOUND (5009)` - User does not exist

### Invoices
- `ERR_INVOICE_ALREADY_PAID (5010)` - Invoice already paid
- `ERR_SAVING_INVOICE_DATA (5011)` - Error saving invoice
- `ERR_INVOICE_NOT_FOUND (5012)` - Invoice does not exist
- `ERR_RECENT_PAYMENT_NOT_FOUND (5013)` - No recent payment found

## Functions

### Resource Management

#### add-resource
```clarity
(add-resource (name (string-utf8 50)) (description (string-utf8 255)) (price uint) (url (optional (string-utf8 255))))
```
Adds a new resource with pricing. DAO/extension only.

#### toggle-resource
```clarity
(toggle-resource (resourceIndex uint))
```
Enables/disables a resource. DAO/extension only.

#### toggle-resource-by-name
```clarity
(toggle-resource-by-name (name (string-utf8 50)))
```
Enables/disables a resource by name. DAO/extension only.

### Payment Processing

#### pay-invoice
```clarity
(pay-invoice (resourceIndex uint) (memo (optional (buff 34))))
```
Processes payment for a resource.

#### pay-invoice-by-resource-name
```clarity
(pay-invoice-by-resource-name (name (string-utf8 50)) (memo (optional (buff 34))))
```
Processes payment using resource name.

#### set-payment-address
```clarity
(set-payment-address (newAddress principal))
```
Updates payment destination. DAO/extension only.

### Read-Only Functions

#### Resource Info
- `get-total-resources` - Number of resources
- `get-resource-index` - Get resource ID by name
- `get-resource` - Get resource details by ID
- `get-resource-by-name` - Get resource details by name

#### User Info
- `get-total-users` - Number of users
- `get-user-index` - Get user ID by address
- `get-user-data` - Get user details by ID
- `get-user-data-by-address` - Get user details by address

#### Invoice Info
- `get-total-invoices` - Number of invoices
- `get-invoice` - Get invoice details
- `get-recent-payment` - Get latest payment ID
- `get-recent-payment-data` - Get latest payment details
- `get-recent-payment-data-by-address` - Get latest payment by user/resource

#### Contract Info
- `get-payment-address` - Current payment address
- `get-total-revenue` - Total contract revenue
- `get-contract-data` - Aggregate contract statistics

## Usage Examples

### Adding a Resource

```clarity
(contract-call? .aibtc-ext005-payments add-resource 
  "premium-access" 
  "Premium API access" 
  u1000000 
  (some "https://api.example.com")
)
```

### Making a Payment

```clarity
(contract-call? .aibtc-ext005-payments pay-invoice-by-resource-name 
  "premium-access"
  (some 0x0102...)
)
```

### Checking Payment Status

```clarity
(contract-call? .aibtc-ext005-payments get-recent-payment-data-by-address 
  "premium-access"
  tx-sender
)
```
