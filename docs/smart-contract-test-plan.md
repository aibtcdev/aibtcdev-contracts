# aibtc smart contract test plan

All tests will be created with and executed using the Clarinet JS SDK.

## Main DAO

### aibtcdev-base-dao

set-extension() fails if caller is not DAO or extension
set-extensions() fails if caller is not DAO or extension
execute() fails if caller is not DAO or extension
construct() fails when called by an account that is not the deployer
construct() fails when initializing the DAO with bootstrap proposal a second time
construct() succeeds when initializing the DAO with bootstrap proposal
request-extension-callback() fails if caller is not an extension
request-extension-callback() succeeds and calls an extension

is-extension() succeeds and returns false with unrecognized extension
is-extension() succeeds and returns true for active extensions
executed-at() succeeds and returns none with unrecognized proposal
executed-at() succeeds and returns the Bitcoin block height the proposal was executed

## Extensions

### aibtc-ext001-actions

execute-action() fails if action is not recognized
execute-action() fails if parameters are invalid
execute-action() succeeds with valid "send-message" action
execute-action() succeeds with valid "add-resource" action
execute-action() succeeds with valid "batch-messages" action
execute-action() succeeds with valid "batch-resources" action
execute-action() succeeds with valid "allow-asset" action
execute-action() succeeds with valid "delegate-stx" action
execute-action() succeeds with valid "set-account-holder" action
execute-action() succeeds with valid "set-withdrawal-period" action
execute-action() succeeds with valid "set-withdrawal-amount" action
execute-action() succeeds with valid "toggle-resource" action
execute-action() succeeds with valid "set-payment-address" action

### aibtc-ext002-bank-account

set-account-holder() fails if caller is not DAO or extension
set-account-holder() succeeds and sets the account holder to a standard principal
set-account-holder() succeeds and sets the account holder to a contract principal

set-withdrawal-period() fails if caller is not DAO or extension
set-withdrawal-period() fails if value is set to 0
set-withdrawal-period() succeeds and sets the withdrawal period

set-withdrawal-amount() fails if caller is not DAO or extension
set-withdrawal-amount() fails if value is set to 0
set-withdrawal-amount() succeeds and sets the withdrawal amount

override-last-withdrawal-block() fails if caller is not DAO or extension
override-last-withdrawal-block() fails if value is set to 0
override-last-withdrawal-block() fails if value is set less than deployed height
override-last-withdrawal-block() succeeds and sets the withdrawal block

get-account-terms() succeeds and returns expected values

### aibtc-ext003-direct-execute

set-protocol-treasury() fails if caller is not DAO or extension
set-protocol-treasury() fails if treasury is not a contract
set-protocol-treasury() fails if treasury is self
set-protocol-treasury() fails if treasury is already set
set-protocol-treasury() succeeds and sets new treasury

set-voting-token() fails if caller is not DAO or extension
set-voting-token() fails if token is not a contract
set-voting-token() fails if token is not initialized
set-voting-token() fails if token mismatches
set-voting-token() succeeds and sets new token

create-proposal() fails if contract not initialized
create-proposal() fails if token mismatches
create-proposal() fails if caller has no balance
create-proposal() fails if proposal already executed
create-proposal() succeeds and creates new proposal

vote-on-proposal() fails if contract not initialized
vote-on-proposal() fails if token mismatches
vote-on-proposal() fails if caller has no balance
vote-on-proposal() fails if proposal already executed
vote-on-proposal() fails if voting too soon
vote-on-proposal() fails if voting too late
vote-on-proposal() fails if proposal concluded
vote-on-proposal() fails if already voted
vote-on-proposal() succeeds and records vote

conclude-proposal() fails if contract not initialized
conclude-proposal() fails if treasury mismatches
conclude-proposal() fails if proposal already executed
conclude-proposal() fails if proposal still active
conclude-proposal() fails if proposal already concluded
conclude-proposal() succeeds and executes if passed
conclude-proposal() succeeds without executing if failed

### aibtc-ext004-messaging

send() succeeds if called by any user with isFromDao false
send() fails if called by any user with isFromDao true
send() succeeds if called by a DAO proposal

### aibtc-ext005-payments

set-payment-address() fails if caller is not DAO or extension
set-payment-address() fails if old address matches current payment address
set-payment-address() fails if old address and new address are the same
set-payment-address() succeeds and sets the new payment address

add-resource() fails if caller is not DAO or extension
add-resource() fails if name is blank
add-resource() fails if description is blank
add-resource() fails if price is 0
add-resource() fails if provided url is blank
add-resource() fails if resource name already used
add-resource() succeeds and adds a new resource

toggle-resource() fails if caller is not DAO or extension
toggle-resource() fails if resource is not found
toggle-resource() fails if resource index is 0
toggle-resource() succeeds and toggles if resource is enabled

toggle-resource-by-name() fails if caller is not DAO or extension
toggle-resource-by-name() fails if resource is not found
toggle-resource() succeeds and toggles if resource is enabled

pay-invoice() fails if resource is not found
pay-invoice() fails if resource index is 0
pay-invoice() fails if resource is disabled
pay-invoice() succeeds and updates info for resource

pay-invoice-by-resource-name() fails if resource is not found
pay-invoice-by-resource-name() fails if resource is disabled
pay-invoice-by-resource-name() succeeds and updates info for resource

### aibtc-ext006-treasury

allow-asset() fails if caller is not DAO or extension
allow-asset() succeeds and sets new allowed asset
allow-asset() succeeds and toggles status of existing asset

allow-assets() fails if caller is not DAO or extension
allow-assets() succeeds and sets new allowed assets
allow-assets() succeeds and toggles status of existing assets

deposit-stx() succeeds and deposits STX to the treasury

deposit-ft() fails if asset is not allowed
deposit-ft() succeeds and transfers FT to treasury

deposit-nft() fails if asset is not allowed
deposit-nft() succeeds and transfers NFT to treasury

withdraw-stx() fails if caller is not DAO or extension
withdraw-stx() succeeds and transfers STX to a standard principal
withdraw-stx() succeeds and transfers STX to a contract principal

withdraw-ft() fails if caller is not DAO or extension
withdraw-ft() succeeds and transfers FT to a standard principal
withdraw-ft() succeeds and transfers FT to a contract principal

withdraw-nft() fails if caller is not DAO or extension
withdraw-nft() succeeds and transfers NFT to a standard principal
withdraw-nft() succeeds and transfers NFT to a contract principal

delegate-stx() fails if caller is not DAO or extension
delegate-stx() succeeds and delegates to Stacks PoX

revoke-delegate-stx() fails if caller is not DAO or extension
revoke-delegate-stx() fails if contract is not currently stacking
revoke-delegate-stx() succeeds and revokes stacking delegation

## Proposals

### aibtc-prop001-bootstrap

get-dao-manifest() returns DAO_MANIFEST as string
