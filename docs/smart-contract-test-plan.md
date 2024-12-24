# aibtc smart contract test plan

All tests will be created with and executed using the Clarinet JS SDK.

## Main DAO

### aibtcdev-dao

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

### aibtcdev-bank-account

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

### aibtcdev-messaging

send() succeeds if called by any user with isFromDao false
send() fails if called by any user with isFromDao true
send() succeeds if called by a DAO proposal

### aibtcdev-payments

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

### aibtcdev-treasury

TBD

### aibtcdev-token-vote

execute() fails if proposal has already been executed via vote execute

## Proposals

### aibtcdev-bootstrap
