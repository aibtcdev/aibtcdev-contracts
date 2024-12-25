# DAO Traits Documentation

The aibtcdev DAO uses traits to define interfaces that different components must implement. This ensures consistency and interoperability between components.

## Core Traits

### Proposal Trait
```clarity
(define-trait proposal (
  (execute (principal) (response bool uint))
))
```
Base trait that all proposals must implement. Enables execution of governance actions.

### Extension Trait
```clarity
(define-trait extension (
  (callback (principal (buff 34)) (response bool uint))
))
```
Base trait that all extensions must implement. Enables inter-extension communication.

### Base DAO Trait
```clarity
(define-trait aibtcdev-base-dao (
  (execute (<proposal-trait> principal) (response bool uint))
  (set-extension (principal bool) (response bool uint))
  (request-extension-callback (<extension-trait> (buff 34)) (response bool uint))
))
```
Core DAO functionality for managing proposals and extensions.

## Extension-Specific Traits

### Bank Account
Manages STX withdrawals with configurable periods and amounts.
[View Documentation](bank-account.md)

### Messaging
Enables on-chain messaging capabilities.
[View Documentation](messaging.md)

### Resources
Manages resource definitions and pricing.
[View Documentation](resources.md)

### Invoices
Handles payment processing for resources.
[View Documentation](invoices.md)

### Treasury
Manages multiple asset types including STX, NFTs, and FTs.
[View Documentation](treasury.md)

### Direct Execute
Enables voting on arbitrary proposals.
[View Documentation](direct-execute.md)

## Implementation Guidelines

When implementing these traits:

1. All functions must return `(response bool uint)` where:
   - `bool`: Success/failure indicator
   - `uint`: Error code on failure

2. Error codes should be in designated ranges:
   - Base DAO: 900-999
   - Actions: 1000-1999
   - Bank Account: 2000-2999
   - Direct Execute: 3000-3999
   - Messaging: 4000-4999
   - Payments: 5000-5999
   - Treasury: 6000-6999

3. Authorization checks should use `is-dao-or-extension` pattern

4. Events should be logged using consistent format:
```clarity
(print {notification: "event-name", payload: {...}})
```
