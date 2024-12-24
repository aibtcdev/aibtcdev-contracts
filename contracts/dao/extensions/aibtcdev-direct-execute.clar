;; title: aibtcdev-direct-execute
;; version: 1.0.0
;; summary: An extension that manages voting on proposals to execute Clarity code using a SIP-010 Stacks token.
;; description: This contract can make changes to core DAO functionality with a high voting threshold by executing Clarity code in the context of the DAO.

;; traits
;;
(impl-trait .aibtcdev-dao-traits-v1.extension)
;; (impl-trait .aibtcdev-dao-traits-v1.voting-core)
;; (impl-trait .aibtcdev-dao-traits-v1.voting-core)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait proposal-trait .aibtcdev-dao-traits-v1.proposal)
(use-trait treasury-trait .aibtcdev-dao-traits-v1.treasury)


;; constants
;;

(define-constant SELF (as-contract tx-sender))
(define-constant VOTING_PERIOD u144) ;; 144 Bitcoin blocks, ~1 day
(define-constant VOTING_QUORUM u95) ;; 95% of liquid supply (total supply - treasury)

;; error messages
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID (err u1001))
(define-constant ERR_NOT_INITIALIZED (err u1002))
(define-constant ERR_INVALID_VOTING_TOKEN (err u1003))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u1004))
(define-constant ERR_FETCHING_BALANCE (err u1005))
(define-constant ERR_SAVING_PROPOSAL (err u1006))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u1007))
(define-constant ERR_VOTE_TOO_SOON (err u1008))
(define-constant ERR_VOTE_TOO_LATE (err u1009))
(define-constant ERR_PROPOSAL_STILL_ACTIVE (err u1010))
(define-constant ERR_QUORUM_NOT_REACHED (err u1011))
(define-constant ERR_ALREADY_VOTED (err u1012))
(define-constant ERR_MUST_BE_CONTRACT (err u1013))
(define-constant ERR_ALREADY_INITIALIZED (err u1014))
(define-constant ERR_CONTRACT_MISMATCH (err u1015))

;; data vars
;;
(define-data-var protocolTreasury principal SELF) ;; the treasury contract for protocol funds
(define-data-var votingToken principal SELF) ;; the FT contract used for voting

;; data maps
;;
(define-map Proposals
  principal ;; proposal contract
  {
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    creator: principal, ;; proposal creator (tx-sender)
    startBlock: uint, ;; block height
    endBlock: uint, ;; block height
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    concluded: bool, ;; has the proposal concluded
    passed: bool, ;; did the proposal pass
  }
)

(define-map VotingRecords
  {
    proposal: principal, ;; proposal contract
    voter: principal ;; voter address
  }
  uint ;; total votes
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-protocol-treasury (treasury <treasury-trait>))
  (let
    (
      (treasuryContract (contract-of treasury))
    )
    (try! (is-dao-or-extension))
    ;; treasury must be a contract
    (asserts! (not (is-standard treasuryContract)) ERR_MUST_BE_CONTRACT)
    ;; treasury cannot be the voting contract
    (asserts! (not (is-eq treasuryContract SELF)) ERR_INVALID)
    ;; treasury cannot be the same value
    (asserts! (not (is-eq treasuryContract (var-get protocolTreasury))) ERR_INVALID)
    (print {
      notification: "set-protocol-treasury",
      payload: {
        treasury: treasuryContract
      }
    })
    (ok (var-set protocolTreasury treasuryContract))
  )
)

(define-public (set-voting-token (token <ft-trait>))
  (let
    (
      (tokenContract (contract-of token))
    )
    (try! (is-dao-or-extension))
    ;; token must be a contract
    (asserts! (not (is-standard tokenContract)) ERR_INVALID)
    (asserts! (is-eq (var-get votingToken) SELF) ERR_INVALID)
    (asserts! (is-eq (var-get votingToken) tokenContract) ERR_INVALID)
    (print {
      notification: "set-voting-token",
      payload: {
        token: tokenContract
      }
    })
    (ok (var-set votingToken tokenContract))
  )
)

(define-public (create-proposal (proposal <proposal-trait>) (token <ft-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (tokenContract (contract-of token))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; token matches set voting token
    (asserts! (is-eq tokenContract (var-get votingToken)) ERR_INVALID_VOTING_TOKEN)
    ;; caller has the required balance
    (asserts! (> (try! (contract-call? token get-balance tx-sender)) u0) ERR_FETCHING_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtcdev-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; print proposal creation event
    (print {
      notification: "create-proposal",
      payload: {
        proposal: proposalContract,
        creator: tx-sender,
        startBlock: burn-block-height,
        endBlock: (+ burn-block-height VOTING_PERIOD)
      }
    })
    ;; create the proposal
    (ok (asserts! (map-insert Proposals proposalContract {
      createdAt: burn-block-height,
      caller: contract-caller,
      creator: tx-sender,
      startBlock: burn-block-height,
      endBlock: (+ burn-block-height VOTING_PERIOD),
      votesFor: u0,
      votesAgainst: u0,
      concluded: false,
      passed: false,
    }) ERR_SAVING_PROPOSAL))
))

(define-public (vote-on-proposal (proposal <proposal-trait>) (token <ft-trait>) (vote bool))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      (tokenContract (contract-of token))
      (senderBalance (try! (contract-call? token get-balance tx-sender)))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; token matches set voting token
    (asserts! (is-eq tokenContract (var-get votingToken)) ERR_INVALID_VOTING_TOKEN)
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_FETCHING_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtcdev-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal is still active
    (asserts! (>= burn-block-height (get startBlock proposalRecord)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get endBlock proposalRecord)) ERR_VOTE_TOO_LATE)
    ;; vote not already cast
    (asserts! (is-none (map-get? VotingRecords {proposal: proposalContract, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print vote event
    (print {
      notification: "vote-on-proposal",
      payload: {
        proposal: proposalContract,
        voter: tx-sender,
        amount: senderBalance
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalContract
      (if vote
        (merge proposalRecord {votesFor: (+ (get votesFor proposalRecord) senderBalance)})
        (merge proposalRecord {votesAgainst: (+ (get votesAgainst proposalRecord) senderBalance)})
      )
    )
    ;; record the vote for the sender
    (ok (map-set VotingRecords {proposal: proposalContract, voter: tx-sender} senderBalance))
  )
)

(define-public (conclude-proposal (proposal <proposal-trait>) (token <ft-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      (tokenContract (contract-of token))
      (totalSupply (try! (contract-call? token get-total-supply)))
      (votePassed (>= (get votesFor proposalRecord) (/ (* totalSupply VOTING_QUORUM) u100)))
    )
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtcdev-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal past end block height
    (asserts! (>= burn-block-height (get endBlock proposalRecord)) ERR_PROPOSAL_STILL_ACTIVE)
    ;; voting quorum met
    (asserts! votePassed ERR_QUORUM_NOT_REACHED)
    ;; print conclusion event
    (print {
      notification: "conclude-proposal",
      payload: {
        proposal: proposalContract,
        passed: (> (get votesFor proposalRecord) (get votesAgainst proposalRecord))
      }
    })
    (ok true)
  )
)

;; read only functions
;;

(define-read-only (get-protocol-treasury)
  (if (is-eq (var-get protocolTreasury) SELF)
    none
    (some (var-get protocolTreasury))
  )
)

(define-read-only (get-voting-token)
  (if (is-eq (var-get votingToken) SELF)
    none
    (some (var-get votingToken))
  )
)

(define-read-only (get-proposal (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (get-total-votes (proposal principal) (voter principal))
  (default-to u0 (map-get? VotingRecords {proposal: proposal, voter: voter}))
)

(define-read-only (is-initialized)
  ;; check if the required variables are set
  (not (or
    (is-eq (var-get votingToken) SELF)
    (is-eq (var-get protocolTreasury) SELF)
  ))
)

;; private functions
;; 

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
