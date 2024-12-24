# Treasury Trait

The treasury trait defines the interface for managing multiple asset types including STX, SIP-009 NFTs, and SIP-010 FTs.

## Interface

```clarity
(define-trait treasury (
  (allow-asset (principal bool) (response bool uint))
  (deposit-stx (uint) (response bool uint))
  (deposit-ft (<ft-trait> uint) (response bool uint))
  (deposit-nft (<nft-trait> uint) (response bool uint))
  (withdraw-stx (uint principal) (response bool uint))
  (withdraw-ft (<ft-trait> uint principal) (response bool uint))
  (withdraw-nft (<nft-trait> uint principal) (response bool uint))
  (delegate-stx (uint principal) (response bool uint))
  (revoke-delegate-stx () (response bool uint))
))
```

## Functions

### Asset Management

#### allow-asset
Controls which assets can be deposited/withdrawn.
- Parameters:
  - `token`: Asset contract principal
  - `enabled`: Whether to allow the asset
- Access: DAO/extension only
- Returns: Success/failure response

### Deposits

#### deposit-stx
Deposits STX to treasury.
- Parameters:
  - `amount`: Amount in microSTX
- Access: Public
- Returns: Success/failure response

#### deposit-ft
Deposits SIP-010 tokens.
- Parameters:
  - `ft`: Token contract
  - `amount`: Token amount
- Access: Public
- Returns: Success/failure response

#### deposit-nft
Deposits SIP-009 NFT.
- Parameters:
  - `nft`: NFT contract
  - `id`: Token ID
- Access: Public
- Returns: Success/failure response

### Withdrawals

#### withdraw-stx
Withdraws STX from treasury.
- Parameters:
  - `amount`: Amount in microSTX
  - `recipient`: Recipient address
- Access: DAO/extension only
- Returns: Success/failure response

#### withdraw-ft
Withdraws SIP-010 tokens.
- Parameters:
  - `ft`: Token contract
  - `amount`: Token amount
  - `recipient`: Recipient address
- Access: DAO/extension only
- Returns: Success/failure response

#### withdraw-nft
Withdraws SIP-009 NFT.
- Parameters:
  - `nft`: NFT contract
  - `id`: Token ID
  - `recipient`: Recipient address
- Access: DAO/extension only
- Returns: Success/failure response

### Stacking

#### delegate-stx
Delegates STX for PoX stacking.
- Parameters:
  - `amount`: Max amount to delegate
  - `to`: Delegate address
- Access: DAO/extension only
- Returns: Success/failure response

#### revoke-delegate-stx
Revokes STX delegation.
- Parameters: None
- Access: DAO/extension only
- Returns: Success/failure response

## Implementation Requirements

1. Maintain allowlist of accepted assets
2. Verify asset transfers succeed
3. Enforce DAO/extension-only access for protected functions
4. Track asset balances accurately
5. Handle PoX delegation safely

## Usage Pattern

Implementations should:
1. Use allowlist for asset control
2. Verify transfer success
3. Emit comprehensive logs
4. Handle errors gracefully

Example implementation:
```clarity
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    ;; Check allowlist
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    
    ;; Transfer tokens
    (try! (contract-call? ft transfer 
      amount tx-sender TREASURY none))
    
    ;; Log deposit
    (print {
      notification: "deposit-ft",
      payload: {
        token: (contract-of ft),
        amount: amount,
        sender: tx-sender
      }
    })
    
    (ok true)
  )
)
```
