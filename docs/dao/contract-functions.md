# DAO Contract Functions

## aibtcdev-base-dao

| Function Name              | Function Type | Action Type | Description                                       |
| -------------------------- | ------------- | ----------- | ------------------------------------------------- |
| construct                  | public        | TBD         | Initial construction of the DAO                   |
| execute                    | public        | TBD         | Execute Clarity code in a proposal                |
| set-extension              | public        | TBD         | Add an extension or update status of existing one |
| set-extensions             | public        | TBD         | Add multiple extensions or update status          |
| request-extension-callback | public        | TBD         | Request a callback from an extension              |
| is-extension               | read-only     | TBD         | Check if given principal is an extension          |
| executed-at                | read-only     | TBD         | Get block height when proposal was executed       |

## aibtc-ext001-actions

| Function Name         | Function Type | Action Type | Description                         |
| --------------------- | ------------- | ----------- | ----------------------------------- |
| callback              | public        | TBD         | Extension callback handler          |
| set-protocol-treasury | public        | TBD         | Set the protocol treasury contract  |
| set-voting-token      | public        | TBD         | Set the voting token contract       |
| propose-action        | public        | TBD         | Create a new action proposal        |
| vote-on-proposal      | public        | TBD         | Vote on an existing proposal        |
| conclude-proposal     | public        | TBD         | Conclude and execute a proposal     |
| get-protocol-treasury | read-only     | TBD         | Get the protocol treasury principal |
| get-voting-token      | read-only     | TBD         | Get the voting token principal      |
| get-proposal          | read-only     | TBD         | Get proposal details by ID          |
| get-total-votes       | read-only     | TBD         | Get total votes for proposal/voter  |
| is-initialized        | read-only     | TBD         | Check if contract is initialized    |
| get-voting-period     | read-only     | TBD         | Get the voting period length        |
| get-voting-quorum     | read-only     | TBD         | Get the required voting quorum      |
| get-total-proposals   | read-only     | TBD         | Get total number of proposals       |

## aibtc-ext002-bank-account

| Function Name                  | Function Type | Action Type | Description                        |
| ------------------------------ | ------------- | ----------- | ---------------------------------- |
| callback                       | public        | TBD         | Extension callback handler         |
| set-account-holder             | public        | TBD         | Set the account holder principal   |
| set-withdrawal-period          | public        | TBD         | Set the withdrawal period          |
| set-withdrawal-amount          | public        | TBD         | Set the withdrawal amount          |
| override-last-withdrawal-block | public        | TBD         | Override the last withdrawal block |
| deposit-stx                    | public        | TBD         | Deposit STX to the contract        |
| withdraw-stx                   | public        | TBD         | Withdraw STX from the contract     |
| get-deployed-block             | read-only     | TBD         | Get contract deployment block      |
| get-account-balance            | read-only     | TBD         | Get current account balance        |
| get-account-holder             | read-only     | TBD         | Get current account holder         |
| get-last-withdrawal-block      | read-only     | TBD         | Get last withdrawal block          |
| get-withdrawal-period          | read-only     | TBD         | Get current withdrawal period      |
| get-withdrawal-amount          | read-only     | TBD         | Get current withdrawal amount      |
| get-account-terms              | read-only     | TBD         | Get all account terms              |

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
| callback      | public        | TBD         | Extension callback handler |
| send          | public        | TBD         | Send a message on-chain    |

## aibtc-ext005-payments

| Function Name                      | Function Type | Action Type | Description                        |
| ---------------------------------- | ------------- | ----------- | ---------------------------------- |
| callback                           | public        | TBD         | Extension callback handler         |
| set-payment-address                | public        | TBD         | Set payment address for invoices   |
| add-resource                       | public        | TBD         | Add a new resource                 |
| toggle-resource                    | public        | TBD         | Toggle resource enabled status     |
| toggle-resource-by-name            | public        | TBD         | Toggle resource by name            |
| pay-invoice                        | public        | TBD         | Pay invoice for a resource         |
| pay-invoice-by-resource-name       | public        | TBD         | Pay invoice by resource name       |
| get-total-users                    | read-only     | TBD         | Get total registered users         |
| get-user-index                     | read-only     | TBD         | Get user index by address          |
| get-user-data                      | read-only     | TBD         | Get user data by index             |
| get-user-data-by-address           | read-only     | TBD         | Get user data by address           |
| get-total-resources                | read-only     | TBD         | Get total registered resources     |
| get-resource-index                 | read-only     | TBD         | Get resource index by name         |
| get-resource                       | read-only     | TBD         | Get resource data by index         |
| get-resource-by-name               | read-only     | TBD         | Get resource data by name          |
| get-total-invoices                 | read-only     | TBD         | Get total registered invoices      |
| get-invoice                        | read-only     | TBD         | Get invoice data by index          |
| get-recent-payment                 | read-only     | TBD         | Get recent payment by indexes      |
| get-recent-payment-data            | read-only     | TBD         | Get recent payment data by indexes |
| get-recent-payment-data-by-address | read-only     | TBD         | Get payment data by address        |
| get-payment-address                | read-only     | TBD         | Get current payment address        |
| get-total-revenue                  | read-only     | TBD         | Get total contract revenue         |
| get-contract-data                  | read-only     | TBD         | Get aggregate contract data        |

## aibtc-ext006-treasury

| Function Name       | Function Type | Action Type | Description                        |
| ------------------- | ------------- | ----------- | ---------------------------------- |
| callback            | public        | TBD         | Extension callback handler         |
| allow-asset         | public        | TBD         | Add/update asset in allowed list   |
| allow-assets        | public        | TBD         | Add/update multiple allowed assets |
| deposit-stx         | public        | TBD         | Deposit STX to treasury            |
| deposit-ft          | public        | TBD         | Deposit FT to treasury             |
| deposit-nft         | public        | TBD         | Deposit NFT to treasury            |
| withdraw-stx        | public        | TBD         | Withdraw STX from treasury         |
| withdraw-ft         | public        | TBD         | Withdraw FT from treasury          |
| withdraw-nft        | public        | TBD         | Withdraw NFT from treasury         |
| delegate-stx        | public        | TBD         | Delegate STX for stacking          |
| revoke-delegate-stx | public        | TBD         | Revoke STX delegation              |
| is-allowed-asset    | read-only     | TBD         | Check if asset is allowed          |
| get-allowed-asset   | read-only     | TBD         | Get allowed asset status           |
