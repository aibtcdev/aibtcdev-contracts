# Direct Execute Extension

The direct execute extension (`aibtc-ext003-direct-execute.clar`) enables voting on proposals to execute arbitrary Clarity code in the context of the DAO.

## Key Features

- Token-weighted voting using SIP-010 tokens
- Configurable voting period (144 blocks, ~1 day)
- High quorum requirement (95% of liquid supply)
- Proposal execution tracking
- Vote recording per proposal/voter

## Error Codes

### Authorization
- `ERR_UNAUTHORIZED (3000)` - Caller not authorized
- `ERR_NOT_DAO_OR_EXTENSION (3001)` - Not called by DAO or extension

### Initialization
- `ERR_NOT_INITIALIZED (3100)` - Required settings not configured
- `ERR_ALREADY_INITIALIZED (3101)` - Settings already configured

### Treasury
- `ERR_TREASURY_MUST_BE_CONTRACT (3200)` - Treasury must be contract
- `ERR_TREASURY_CANNOT_BE_SELF (3201)` - Treasury cannot be self
- `ERR_TREASURY_ALREADY_SET (3202)` - Treasury already configured
- `ERR_TREASURY_MISMATCH (3203)` - Treasury does not match

### Voting Token
- `ERR_TOKEN_MUST_BE_CONTRACT (3300)` - Token must be contract
- `ERR_TOKEN_NOT_INITIALIZED (3301)` - Token not configured
- `ERR_TOKEN_MISMATCH (3302)` - Token does not match
- `ERR_INSUFFICIENT_BALANCE (3303)` - Insufficient token balance

### Proposals
- `ERR_PROPOSAL_NOT_FOUND (3400)` - Proposal not found
- `ERR_PROPOSAL_ALREADY_EXECUTED (3401)` - Already executed
- `ERR_PROPOSAL_STILL_ACTIVE (3402)` - Still in voting period
- `ERR_SAVING_PROPOSAL (3403)` - Error saving proposal
- `ERR_PROPOSAL_ALREADY_CONCLUDED (3404)` - Already concluded

### Voting
- `ERR_VOTE_TOO_SOON (3500)` - Before start block
- `ERR_VOTE_TOO_LATE (3501)` - After end block
- `ERR_ALREADY_VOTED (3502)` - Already voted
- `ERR_ZERO_VOTING_POWER (3503)` - No voting power
- `ERR_QUORUM_NOT_REACHED (3504)` - Quorum not met

## Functions

### Configuration

#### set-protocol-treasury
```clarity
(set-protocol-treasury (treasury <treasury-trait>))
```
Sets the treasury contract. DAO/extension only.

#### set-voting-token
```clarity
(set-voting-token (token <ft-trait>))
```
Sets the SIP-010 token used for voting. DAO/extension only.

### Proposals

#### create-proposal
```clarity
(create-proposal (proposal <proposal-trait>) (token <ft-trait>))
```
Creates a new proposal for voting.

#### vote-on-proposal
```clarity
(vote-on-proposal (proposal <proposal-trait>) (token <ft-trait>) (vote bool))
```
Casts a vote on a proposal.

#### conclude-proposal
```clarity
(conclude-proposal (proposal <proposal-trait>) (treasury <treasury-trait>) (token <ft-trait>))
```
Concludes voting and executes if passed.

### Read-Only Functions

- `get-protocol-treasury` - Current treasury contract
- `get-voting-token` - Current voting token
- `get-proposal` - Proposal details
- `get-total-votes` - Vote count for proposal/voter
- `is-initialized` - Configuration status
- `get-voting-period` - Current voting period
- `get-voting-quorum` - Required quorum percentage

## Usage Examples

### Creating a Proposal

```clarity
(contract-call? .aibtc-ext003-direct-execute create-proposal .my-proposal .voting-token)
```

### Voting on a Proposal

```clarity
(contract-call? .aibtc-ext003-direct-execute vote-on-proposal .my-proposal .voting-token true)
```

### Concluding a Proposal

```clarity
(contract-call? .aibtc-ext003-direct-execute conclude-proposal .my-proposal .treasury .voting-token)
```
