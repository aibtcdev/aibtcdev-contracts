# Messaging Extension

The messaging extension (`aibtc-ext004-messaging.clar`) enables on-chain messaging capabilities for the DAO and authorized extensions.

## Key Features

- Send messages up to 1MB in length
- Messages are recorded on-chain via print events
- Messages can be sent by DAO or extensions
- Each message includes sender metadata
- Message envelope contains block height and caller info

## Error Codes

- `ERR_UNAUTHORIZED (4000)` - Caller not authorized
- `INPUT_ERROR (400)` - Invalid message format/length

## Functions

### Public Functions

#### send
```clarity
(send (msg (string-ascii 1048576)) (isFromDao bool))
```
Sends a message on-chain. If isFromDao is true, requires DAO/extension authorization.

#### callback
```clarity
(callback (sender principal) (memo (buff 34)))
```
Standard extension callback support.

### Private Functions

#### is-dao-or-extension
```clarity
(is-dao-or-extension)
```
Verifies caller is DAO or enabled extension.

## Message Format

Messages are logged in two parts:

1. The message content itself
2. An envelope with metadata:
```json
{
  "notification": "send",
  "payload": {
    "caller": "<contract-caller>",
    "height": "<block-height>", 
    "isFromDao": "<bool>",
    "sender": "<tx-sender>"
  }
}
```

## Usage Examples

### Sending a Message (as DAO/extension)

```clarity
(contract-call? .aibtc-ext004-messaging send "Hello World" true)
```

### Sending a Message (as regular user)

```clarity
(contract-call? .aibtc-ext004-messaging send "Hello World" false)
```

### Reading Messages

Messages can be read by:
1. Watching for print events from the contract
2. Querying historical print events
3. Using event indexing services
