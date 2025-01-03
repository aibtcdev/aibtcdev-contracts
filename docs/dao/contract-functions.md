# DAO Contract Functions

## aibtcdev-base-dao

| Function Name              | Function Type | Action Type | Description                                       |
| -------------------------- | ------------- | ----------- | ------------------------------------------------- |
| construct                  | public        | setup       | Initial construction of the DAO                   |
| execute                    | public        | n/a         | Execute Clarity code in a proposal                |
| set-extension              | public        | core        | Add an extension or update status of existing one |
| set-extensions             | public        | core        | Add multiple extensions or update status          |
| request-extension-callback | public        | n/a         | Request a callback from an extension              |
| is-extension               | read-only     | any         | Check if given principal is an extension          |
| executed-at                | read-only     | any         | Get block height when proposal was executed       |

## aibtc-ext001-actions

| Function Name         | Function Type | Action Type | Description                         |
| --------------------- | ------------- | ----------- | ----------------------------------- |
| callback              | public        | n/a         | Extension callback handler          |
| set-protocol-treasury | public        | core        | Set the protocol treasury contract  |
| set-voting-token      | public        | setup       | Set the voting token contract       |
| propose-action        | public        | holder      | Create a new action proposal        |
| vote-on-proposal      | public        | holder      | Vote on an existing proposal        |
| conclude-proposal     | public        | any         | Conclude and execute a proposal     |
| get-protocol-treasury | read-only     | any         | Get the protocol treasury principal |
| get-voting-token      | read-only     | any         | Get the voting token principal      |
| get-proposal          | read-only     | any         | Get proposal details by ID          |
| get-total-votes       | read-only     | any         | Get total votes for proposal/voter  |
| is-initialized        | read-only     | any         | Check if contract is initialized    |
| get-voting-period     | read-only     | any         | Get the voting period length        |
| get-voting-quorum     | read-only     | any         | Get the required voting quorum      |
| get-total-proposals   | read-only     | any         | Get total number of proposals       |

## aibtc-ext002-bank-account

| Function Name                  | Function Type | Action Type | Description                        |
| ------------------------------ | ------------- | ----------- | ---------------------------------- |
| callback                       | public        | n/a         | Extension callback handler         |
| set-account-holder             | public        | action      | Set the account holder principal   |
| set-withdrawal-period          | public        | core        | Set the withdrawal period          |
| set-withdrawal-amount          | public        | core        | Set the withdrawal amount          |
| override-last-withdrawal-block | public        | core        | Override the last withdrawal block |
| deposit-stx                    | public        | any         | Deposit STX to the contract        |
| withdraw-stx                   | public        | any         | Withdraw STX from the contract     |
| get-deployed-block             | read-only     | any         | Get contract deployment block      |
| get-account-balance            | read-only     | any         | Get current account balance        |
| get-account-holder             | read-only     | any         | Get current account holder         |
| get-last-withdrawal-block      | read-only     | any         | Get last withdrawal block          |
| get-withdrawal-period          | read-only     | any         | Get current withdrawal period      |
| get-withdrawal-amount          | read-only     | any         | Get current withdrawal amount      |
| get-account-terms              | read-only     | any         | Get all account terms              |

## aibtc-ext003-direct-execute

| Function Name         | Type      | Description                         |
| --------------------- | --------- | ----------------------------------- |
| callback              | public    | Extension callback handler          |
| set-protocol-treasury | public    | Set the protocol treasury contract  |
| set-voting-token      | public    | Set the voting token contract       |
| create-proposal       | public    | Create a new proposal               |
| vote-on-proposal      | public    | Vote on an existing proposal        |
| conclude-proposal     | public    | Conclude and execute a proposal     |
| get-protocol-treasury | read-only | Get the protocol treasury principal |
| get-voting-token      | read-only | Get the voting token principal      |
| get-proposal          | read-only | Get proposal details by ID          |
| get-total-votes       | read-only | Get total votes for proposal/voter  |
| is-initialized        | read-only | Check if contract is initialized    |
| get-voting-period     | read-only | Get the voting period length        |
| get-voting-quorum     | read-only | Get the required voting quorum      |

## aibtc-ext004-messaging

| Function Name | Function Type | Action Type | Description                |
| ------------- | ------------- | ----------- | -------------------------- |
| callback      | public        | n/a         | Extension callback handler |
| send          | public        | action      | Send a message on-chain    |

## aibtc-ext005-payments

| Function Name                      | Function Type | Action Type | Description                        |
| ---------------------------------- | ------------- | ----------- | ---------------------------------- |
| callback                           | public        | n/a         | Extension callback handler         |
| set-payment-address                | public        | core        | Set payment address for invoices   |
| add-resource                       | public        | action      | Add a new resource                 |
| toggle-resource                    | public        | action      | Toggle resource enabled status     |
| toggle-resource-by-name            | public        | action      | Toggle resource by name            |
| pay-invoice                        | public        | any         | Pay invoice for a resource         |
| pay-invoice-by-resource-name       | public        | any         | Pay invoice by resource name       |
| get-total-users                    | read-only     | any         | Get total registered users         |
| get-user-index                     | read-only     | any         | Get user index by address          |
| get-user-data                      | read-only     | any         | Get user data by index             |
| get-user-data-by-address           | read-only     | any         | Get user data by address           |
| get-total-resources                | read-only     | any         | Get total registered resources     |
| get-resource-index                 | read-only     | any         | Get resource index by name         |
| get-resource                       | read-only     | any         | Get resource data by index         |
| get-resource-by-name               | read-only     | any         | Get resource data by name          |
| get-total-invoices                 | read-only     | any         | Get total registered invoices      |
| get-invoice                        | read-only     | any         | Get invoice data by index          |
| get-recent-payment                 | read-only     | any         | Get recent payment by indexes      |
| get-recent-payment-data            | read-only     | any         | Get recent payment data by indexes |
| get-recent-payment-data-by-address | read-only     | any         | Get payment data by address        |
| get-payment-address                | read-only     | any         | Get current payment address        |
| get-total-revenue                  | read-only     | any         | Get total contract revenue         |
| get-contract-data                  | read-only     | any         | Get aggregate contract data        |

## aibtc-ext006-treasury

| Function Name       | Function Type | Action Type | Description                        |
| ------------------- | ------------- | ----------- | ---------------------------------- |
| callback            | public        | n/a         | Extension callback handler         |
| allow-asset         | public        | action      | Add/update asset in allowed list   |
| allow-assets        | public        | action      | Add/update multiple allowed assets |
| deposit-stx         | public        | any         | Deposit STX to treasury            |
| deposit-ft          | public        | any         | Deposit FT to treasury             |
| deposit-nft         | public        | any         | Deposit NFT to treasury            |
| withdraw-stx        | public        | core        | Withdraw STX from treasury         |
| withdraw-ft         | public        | core        | Withdraw FT from treasury          |
| withdraw-nft        | public        | core        | Withdraw NFT from treasury         |
| delegate-stx        | public        | core        | Delegate STX for stacking          |
| revoke-delegate-stx | public        | core        | Revoke STX delegation              |
| is-allowed-asset    | read-only     | any         | Check if asset is allowed          |
| get-allowed-asset   | read-only     | any         | Get allowed asset status           |

# Function Categories by Action Type

## Setup Functions
These functions are used during initial setup and configuration of contracts:
- `construct` (aibtcdev-base-dao)
- `set-voting-token` (aibtc-ext001-actions)

## Core Functions
These functions represent critical administrative operations:
- `set-extension` (aibtcdev-base-dao)
- `set-extensions` (aibtcdev-base-dao)
- `set-protocol-treasury` (aibtc-ext001-actions)
- `set-withdrawal-period` (aibtc-ext002-bank-account)
- `set-withdrawal-amount` (aibtc-ext002-bank-account)
- `override-last-withdrawal-block` (aibtc-ext002-bank-account)
- `set-payment-address` (aibtc-ext005-payments)
- `withdraw-stx` (aibtc-ext006-treasury)
- `withdraw-ft` (aibtc-ext006-treasury)
- `withdraw-nft` (aibtc-ext006-treasury)
- `delegate-stx` (aibtc-ext006-treasury)
- `revoke-delegate-stx` (aibtc-ext006-treasury)

## Action Functions
These functions represent standard governance actions:
- `set-account-holder` (aibtc-ext002-bank-account)
- `send` (aibtc-ext004-messaging)
- `add-resource` (aibtc-ext005-payments)
- `toggle-resource` (aibtc-ext005-payments)
- `toggle-resource-by-name` (aibtc-ext005-payments)
- `allow-asset` (aibtc-ext006-treasury)
- `allow-assets` (aibtc-ext006-treasury)

## Holder Functions
These functions are specifically for token holders:
- `propose-action` (aibtc-ext001-actions)
- `vote-on-proposal` (aibtc-ext001-actions)

## Other Categories
- **N/A Functions**: Typically callback handlers and execution functions
- **Any Functions**: Usually read-only functions or general utility functions that anyone can call
