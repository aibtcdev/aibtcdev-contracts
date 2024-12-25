# Base DAO Contract

The base DAO contract (`aibtcdev-base-dao.clar`) is the core contract that manages extensions and proposal execution.

## Key Features

- Manages enabled/disabled status of extensions
- Executes proposals that can modify DAO state
- Controls access to extension functionality
- Maintains record of executed proposals

## Constants

- `ERR_UNAUTHORIZED (900)` - Caller not authorized
- `ERR_ALREADY_EXECUTED (901)` - Proposal already executed
- `ERR_INVALID_EXTENSION (902)` - Extension validation failed
- `ERR_NO_EMPTY_LISTS (903)` - Empty list provided

## Storage

### Data Variables

- `executive` - Principal that can construct the DAO, set to contract itself after construction

### Maps 

- `ExecutedProposals` - Tracks block height when proposals were executed
- `Extensions` - Tracks enabled/disabled status of extensions

## Functions

### Public Functions

#### construct
```clarity
(define-public (construct (proposal <proposal-trait>)))
```
Initial construction of the DAO. Can only be called once by the executive.

#### execute  
```clarity
(define-public (execute (proposal <proposal-trait>) (sender principal)))
```
Executes a proposal contract. Can only be called by the DAO or enabled extensions.

#### set-extension
```clarity
(define-public (set-extension (extension principal) (enabled bool)))
```
Enables or disables an extension. Can only be called by the DAO or enabled extensions.

#### set-extensions
```clarity
(define-public (set-extensions (extensionList (list 200 {extension: principal, enabled: bool}))))
```
Enables or disables multiple extensions. Can only be called by the DAO or enabled extensions.

#### request-extension-callback
```clarity
(define-public (request-extension-callback (extension <extension-trait>) (memo (buff 34))))
```
Requests a callback from an extension. Can only be called by enabled extensions.

### Read-Only Functions

#### is-extension
```clarity
(define-read-only (is-extension (extension principal)))
```
Returns whether an extension is enabled.

#### executed-at
```clarity
(define-read-only (executed-at (proposal <proposal-trait>)))
```
Returns the block height when a proposal was executed, if it was.

## Usage Examples

### Enabling an Extension

```clarity
(contract-call? .aibtcdev-base-dao set-extension .aibtc-ext001-actions true)
```

### Executing a Proposal

```clarity
(contract-call? .aibtcdev-base-dao execute .aibtc-prop001-bootstrap tx-sender)
```

### Checking Extension Status

```clarity
(contract-call? .aibtcdev-base-dao is-extension .aibtc-ext001-actions)
```
