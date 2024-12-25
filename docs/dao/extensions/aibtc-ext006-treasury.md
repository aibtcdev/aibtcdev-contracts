# Treasury Extension

The treasury extension (`aibtc-ext006-treasury.clar`) manages the DAO's assets including STX, SIP-009 NFTs, and SIP-010 FTs.

## Key Features

- Manages multiple asset types:
  - STX (native token)
  - SIP-010 Fungible Tokens
  - SIP-009 Non-Fungible Tokens
- Allowlist-based asset management
- Deposit support for any user
- Protected withdrawals (DAO/extension only)
- STX stacking delegation support

## Error Codes

- `ERR_UNAUTHORIZED (6000)` - Caller not authorized
- `ERR_UNKNOWN_ASSSET (6001)` - Asset not on allowlist

## Functions

### Asset Management

#### allow-asset
```clarity
(allow-asset (token principal) (enabled bool))
```
Adds or updates an asset on the allowlist. DAO/extension only.

#### allow-assets
```clarity
(allow-assets (allowList (list 100 {token: principal, enabled: bool})))
```
Bulk update of asset allowlist. DAO/extension only.

### Deposits

#### deposit-stx
```clarity
(deposit-stx (amount uint))
```
Deposits STX to treasury.

#### deposit-ft
```clarity
(deposit-ft (ft <ft-trait>) (amount uint))
```
Deposits SIP-010 tokens to treasury.

#### deposit-nft
```clarity
(deposit-nft (nft <nft-trait>) (id uint))
```
Deposits SIP-009 NFT to treasury.

### Withdrawals

#### withdraw-stx
```clarity
(withdraw-stx (amount uint) (recipient principal))
```
Withdraws STX from treasury. DAO/extension only.

#### withdraw-ft
```clarity
(withdraw-ft (ft <ft-trait>) (amount uint) (recipient principal))
```
Withdraws SIP-010 tokens from treasury. DAO/extension only.

#### withdraw-nft
```clarity
(withdraw-nft (nft <nft-trait>) (id uint) (recipient principal))
```
Withdraws SIP-009 NFT from treasury. DAO/extension only.

### Stacking

#### delegate-stx
```clarity
(delegate-stx (maxAmount uint) (to principal))
```
Delegates STX for stacking. DAO/extension only.

#### revoke-delegate-stx
```clarity
(revoke-delegate-stx)
```
Revokes STX delegation. DAO/extension only.

### Read-Only Functions

#### is-allowed-asset
```clarity
(is-allowed-asset (assetContract principal))
```
Returns whether an asset is on allowlist.

#### get-allowed-asset
```clarity
(get-allowed-asset (assetContract principal))
```
Returns allowlist status for an asset.

## Usage Examples

### Adding Allowed Asset

```clarity
(contract-call? .aibtc-ext006-treasury allow-asset .token-contract true)
```

### Depositing STX

```clarity
(contract-call? .aibtc-ext006-treasury deposit-stx u1000000)
```

### Depositing FT

```clarity
(contract-call? .aibtc-ext006-treasury deposit-ft .token-contract u100)
```

### Withdrawing NFT

```clarity
(contract-call? .aibtc-ext006-treasury withdraw-nft .nft-contract u1 tx-sender)
```

### Delegating STX

```clarity
(contract-call? .aibtc-ext006-treasury delegate-stx u1000000 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR)
```
