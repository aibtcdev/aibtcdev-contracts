# Bank Account Extension

The bank account extension (`aibtc-ext002-bank-account.clar`) enables managed STX withdrawals with configurable periods and amounts.

## Key Features

- Configurable withdrawal period (default: 144 blocks, ~1 day)
- Configurable withdrawal amount (default: 10 STX)
- Single account holder
- Deposit support for any user
- Withdrawal tracking and limits

## Error Codes

- `ERR_INVALID (2000)` - Invalid parameter value
- `ERR_UNAUTHORIZED (2001)` - Caller not authorized
- `ERR_TOO_SOON (2002)` - Withdrawal period not elapsed
- `ERR_INVALID_AMOUNT (2003)` - Invalid amount specified

## Functions

### Configuration

#### set-account-holder
```clarity
(set-account-holder (new principal))
```
Sets the account holder who can make withdrawals. DAO/extension only.

#### set-withdrawal-period
```clarity
(set-withdrawal-period (period uint))
```
Sets the required blocks between withdrawals. DAO/extension only.

#### set-withdrawal-amount  
```clarity
(set-withdrawal-amount (amount uint))
```
Sets the STX amount per withdrawal. DAO/extension only.

### Operations

#### deposit-stx
```clarity
(deposit-stx (amount uint))
```
Allows any user to deposit STX to the contract.

#### withdraw-stx
```clarity
(withdraw-stx)
```
Allows account holder to withdraw configured amount if period elapsed.

### Read-Only Functions

- `get-account-balance` - Current STX balance
- `get-account-holder` - Current account holder
- `get-withdrawal-period` - Current withdrawal period
- `get-withdrawal-amount` - Current withdrawal amount
- `get-last-withdrawal-block` - Block height of last withdrawal
- `get-account-terms` - All account settings and state

## Usage Examples

### Depositing STX

```clarity
(contract-call? .aibtc-ext002-bank-account deposit-stx u1000000)
```

### Withdrawing STX (as account holder)

```clarity
(contract-call? .aibtc-ext002-bank-account withdraw-stx)
```

### Checking Account Terms

```clarity
(contract-call? .aibtc-ext002-bank-account get-account-terms)
```
