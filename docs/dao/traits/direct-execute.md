# Direct Execute Trait

The direct execute trait defines the interface for managing and executing arbitrary proposals through token-weighted voting.

## Interface

```clarity
(define-trait direct-execute (
  (set-protocol-treasury (<treasury>) (response bool uint))
  (set-voting-token (<ft-trait>) (response bool uint))
  (create-proposal (<proposal> <ft-trait>) (response bool uint))
  (vote-on-proposal (<proposal> <ft-trait> bool) (response bool uint))
  (conclude-proposal (<proposal> <treasury> <ft-trait>) (response bool uint))
))
```

## Functions

### Configuration

#### set-protocol-treasury
Sets the treasury contract for proposal execution.
- Parameters:
  - `treasury`: Treasury contract implementing treasury trait
- Access: DAO/extension only
- Returns: Success/failure response

#### set-voting-token
Sets the SIP-010 token used for voting.
- Parameters:
  - `token`: SIP-010 token contract
- Access: DAO/extension only
- Returns: Success/failure response

### Proposal Management

#### create-proposal
Creates new proposal for voting.
- Parameters:
  - `proposal`: Proposal contract
  - `token`: Voting token contract
- Access: Public
- Returns: Success/failure response

#### vote-on-proposal
Casts vote on proposal.
- Parameters:
  - `proposal`: Proposal contract
  - `token`: Voting token contract
  - `vote`: True for yes, false for no
- Access: Token holders
- Returns: Success/failure response

#### conclude-proposal
Concludes voting and executes if passed.
- Parameters:
  - `proposal`: Proposal contract
  - `treasury`: Treasury contract
  - `token`: Voting token contract
- Access: Public
- Returns: Success/failure response

## Implementation Requirements

1. Track proposal status and votes
2. Calculate voting power from token balances
3. Enforce voting period
4. Require minimum quorum
5. Execute proposals atomically

## Usage Pattern

Implementations should:
1. Verify proposal validity
2. Track voting status
3. Calculate results accurately
4. Handle execution safely

Example implementation:
```clarity
(define-public (vote-on-proposal 
    (proposal <proposal>) 
    (token <ft-trait>) 
    (vote bool)
  )
  (let (
    (voting-power (unwrap! (get-balance token tx-sender) ERR_ZERO_POWER))
  )
    ;; Verify voting period
    (asserts! (is-voting-active proposal) ERR_VOTING_ENDED)
    
    ;; Record vote
    (try! (record-vote proposal tx-sender vote voting-power))
    
    ;; Log vote
    (print {
      notification: "vote-cast",
      payload: {
        proposal: proposal,
        voter: tx-sender,
        power: voting-power,
        vote: vote
      }
    })
    
    (ok true)
  )
)
```
