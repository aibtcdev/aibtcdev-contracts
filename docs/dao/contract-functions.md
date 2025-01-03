# DAO Contract Functions

## aibtcdev-base-dao

| Function Name              | Type      | Description                                       |
| -------------------------- | --------- | ------------------------------------------------- |
| construct                  | public    | Initial construction of the DAO                   |
| execute                    | public    | Execute Clarity code in a proposal                |
| set-extension              | public    | Add an extension or update status of existing one |
| set-extensions             | public    | Add multiple extensions or update status          |
| request-extension-callback | public    | Request a callback from an extension              |
| is-extension               | read-only | Check if given principal is an extension          |
| executed-at                | read-only | Get block height when proposal was executed       |

## aibtc-ext001-actions

| Function Name         | Type      | Description                         |
| --------------------- | --------- | ----------------------------------- |
| callback              | public    | Extension callback handler          |
| set-protocol-treasury | public    | Set the protocol treasury contract  |
| set-voting-token      | public    | Set the voting token contract       |
| propose-action        | public    | Create a new action proposal        |
| vote-on-proposal      | public    | Vote on an existing proposal        |
| conclude-proposal     | public    | Conclude and execute a proposal     |
| get-protocol-treasury | read-only | Get the protocol treasury principal |
| get-voting-token      | read-only | Get the voting token principal      |
| get-proposal          | read-only | Get proposal details by ID          |
| get-total-votes       | read-only | Get total votes for proposal/voter  |
| is-initialized        | read-only | Check if contract is initialized    |
| get-voting-period     | read-only | Get the voting period length        |
| get-voting-quorum     | read-only | Get the required voting quorum      |
| get-total-proposals   | read-only | Get total number of proposals       |

## aibtc-ext002-bank-account

| Function Name                  | Type      | Description                        |
| ------------------------------ | --------- | ---------------------------------- |
| callback                       | public    | Extension callback handler         |
| set-account-holder             | public    | Set the account holder principal   |
| set-withdrawal-period          | public    | Set the withdrawal period          |
| set-withdrawal-amount          | public    | Set the withdrawal amount          |
| override-last-withdrawal-block | public    | Override the last withdrawal block |
| deposit-stx                    | public    | Deposit STX to the contract        |
| withdraw-stx                   | public    | Withdraw STX from the contract     |
| get-deployed-block             | read-only | Get contract deployment block      |
| get-account-balance            | read-only | Get current account balance        |
| get-account-holder             | read-only | Get current account holder         |
| get-last-withdrawal-block      | read-only | Get last withdrawal block          |
| get-withdrawal-period          | read-only | Get current withdrawal period      |
| get-withdrawal-amount          | read-only | Get current withdrawal amount      |
| get-account-terms              | read-only | Get all account terms              |

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

| Function Name | Type   | Description                |
| ------------- | ------ | -------------------------- |
| callback      | public | Extension callback handler |
| send          | public | Send a message on-chain    |

## aibtc-ext005-payments

| Function Name                      | Type      | Description                        |
| ---------------------------------- | --------- | ---------------------------------- |
| callback                           | public    | Extension callback handler         |
| set-payment-address                | public    | Set payment address for invoices   |
| add-resource                       | public    | Add a new resource                 |
| toggle-resource                    | public    | Toggle resource enabled status     |
| toggle-resource-by-name            | public    | Toggle resource by name            |
| pay-invoice                        | public    | Pay invoice for a resource         |
| pay-invoice-by-resource-name       | public    | Pay invoice by resource name       |
| get-total-users                    | read-only | Get total registered users         |
| get-user-index                     | read-only | Get user index by address          |
| get-user-data                      | read-only | Get user data by index             |
| get-user-data-by-address           | read-only | Get user data by address           |
| get-total-resources                | read-only | Get total registered resources     |
| get-resource-index                 | read-only | Get resource index by name         |
| get-resource                       | read-only | Get resource data by index         |
| get-resource-by-name               | read-only | Get resource data by name          |
| get-total-invoices                 | read-only | Get total registered invoices      |
| get-invoice                        | read-only | Get invoice data by index          |
| get-recent-payment                 | read-only | Get recent payment by indexes      |
| get-recent-payment-data            | read-only | Get recent payment data by indexes |
| get-recent-payment-data-by-address | read-only | Get payment data by address        |
| get-payment-address                | read-only | Get current payment address        |
| get-total-revenue                  | read-only | Get total contract revenue         |
| get-contract-data                  | read-only | Get aggregate contract data        |

## aibtc-ext006-treasury

| Function Name       | Type      | Description                        |
| ------------------- | --------- | ---------------------------------- |
| callback            | public    | Extension callback handler         |
| allow-asset         | public    | Add/update asset in allowed list   |
| allow-assets        | public    | Add/update multiple allowed assets |
| deposit-stx         | public    | Deposit STX to treasury            |
| deposit-ft          | public    | Deposit FT to treasury             |
| deposit-nft         | public    | Deposit NFT to treasury            |
| withdraw-stx        | public    | Withdraw STX from treasury         |
| withdraw-ft         | public    | Withdraw FT from treasury          |
| withdraw-nft        | public    | Withdraw NFT from treasury         |
| delegate-stx        | public    | Delegate STX for stacking          |
| revoke-delegate-stx | public    | Revoke STX delegation              |
| is-allowed-asset    | read-only | Check if asset is allowed          |
| get-allowed-asset   | read-only | Get allowed asset status           |
