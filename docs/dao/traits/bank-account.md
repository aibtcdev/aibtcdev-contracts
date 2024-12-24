# Bank Account Trait

The bank account trait (`bank-account`) defines the interface for managing STX withdrawals with configurable periods and amounts.

## Interface

```clarity
(define-trait bank-account (
  (set-account-holder (principal) (response bool uint))
  (set-withdrawal-period (uint) (response bool uint))
  (set-withdrawal-amount (uint) (response bool uint))
  (override-last-withdrawal-block (uint) (response bool uint))
  (deposit-stx (uint) (response bool uint))
  (withdraw-stx () (response bool uint))
))
```

## Functions

### Configuration

#### set-account-holder
Sets the principal that can make withdrawals.
- Parameters:
  - `principal`: New account holder address
- Access: DAO/extension only
- Returns: Success/failure response

#### set-withdrawal-period
Sets the required blocks between withdrawals.
- Parameters:
  - `uint`: Number of blocks
- Access: DAO/extension only
- Returns: Success/failure response

#### set-withdrawal-amount
Sets the STX amount per withdrawal.
- Parameters:
  - `uint`: Amount in microSTX
- Access: DAO/extension only
- Returns: Success/failure response

#### override-last-withdrawal-block
Administrative function to override last withdrawal block.
- Parameters:
  - `uint`: Block height
- Access: DAO/extension only
- Returns: Success/failure response

### Operations

#### deposit-stx
Allows any user to deposit STX.
- Parameters:
  - `uint`: Amount in microSTX
- Access: Public
- Returns: Success/failure response

#### withdraw-stx
Allows account holder to withdraw if period elapsed.
- Parameters: None
- Access: Account holder only
- Returns: Success/failure response

## Implementation Requirements

1. Must maintain withdrawal period between withdrawals
2. Must enforce single account holder
3. Must track last withdrawal block
4. Must verify STX transfers succeed
5. Must emit events for all state changes
