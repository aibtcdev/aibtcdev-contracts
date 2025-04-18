;; title: aibtcdev-core-proposals
;; version: 1.0.0
;; summary: An extension that manages voting on proposals to execute Clarity code using a SIP-010 Stacks token.
;; description: This contract can make changes to core DAO functionality with a high voting threshold by executing Clarity code in the context of the DAO.

;; traits
;;
(impl-trait .aibtcdev-dao-traits-v1.extension)
(impl-trait .aibtcdev-dao-traits-v1.core-proposals)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait proposal-trait .aibtcdev-dao-traits-v1.proposal)
(use-trait treasury-trait .aibtcdev-dao-traits-v1.treasury)

;; constants
;;

(define-constant SELF (as-contract tx-sender))
(define-constant VOTING_PERIOD u144) ;; 144 Bitcoin blocks, ~1 day
(define-constant VOTING_QUORUM u95) ;; 95% of liquid supply
(define-constant DEPLOYED_AT burn-block-height)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u3000))
(define-constant ERR_FETCHING_TOKEN_DATA (err u3001))
(define-constant ERR_INSUFFICIENT_BALANCE (err u3002))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u3003))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u3004))
(define-constant ERR_PROPOSAL_STILL_ACTIVE (err u3005))
(define-constant ERR_SAVING_PROPOSAL (err u3006))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u3007))
(define-constant ERR_RETRIEVING_START_BLOCK_HASH (err u3008))
(define-constant ERR_VOTE_TOO_SOON (err u3009))
(define-constant ERR_VOTE_TOO_LATE (err u3010))
(define-constant ERR_ALREADY_VOTED (err u3011))
(define-constant ERR_FIRST_VOTING_PERIOD (err u3012))

;; contracts used for voting calculations
(define-constant VOTING_TOKEN_DEX .aibtc-token-dex)
(define-constant VOTING_TOKEN_POOL .aibtc-bitflow-pool)
(define-constant VOTING_TREASURY .aibtc-treasury)

;; data maps
;;
(define-map Proposals
  principal ;; proposal contract
  {
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    creator: principal, ;; proposal creator (tx-sender)
    startBlockStx: uint, ;; block height for at-block calls
    startBlock: uint, ;; burn block height
    endBlock: uint, ;; burn block height
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    liquidTokens: uint, ;; liquid tokens
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

(define-public (create-proposal (proposal <proposal-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (liquidTokens (try! (get-liquid-supply block-height)))
    )
    ;; at least one voting period passed
    (asserts! (>= burn-block-height (+ DEPLOYED_AT VOTING_PERIOD)) ERR_FIRST_VOTING_PERIOD)
    ;; caller has the required balance
    (asserts! (> (unwrap! (contract-call? .aibtc-token get-balance tx-sender) ERR_FETCHING_TOKEN_DATA) u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtc-base-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; print proposal creation event
    (print {
      notification: "create-proposal",
      payload: {
        proposal: proposalContract,
        contractCaller: contract-caller,
        creator: tx-sender,
        liquidTokens: liquidTokens,
        startBlockStx: block-height,
        startBlock: burn-block-height,
        endBlock: (+ burn-block-height VOTING_PERIOD),
        votingPeriod: VOTING_PERIOD,
        votingQuorum: VOTING_QUORUM
      }
    })
    ;; create the proposal
    (ok (asserts! (map-insert Proposals proposalContract {
      createdAt: burn-block-height,
      caller: contract-caller,
      creator: tx-sender,
      startBlockStx: block-height,
      startBlock: burn-block-height,
      endBlock: (+ burn-block-height VOTING_PERIOD),
      votesFor: u0,
      votesAgainst: u0,
      liquidTokens: liquidTokens,
      concluded: false,
      passed: false,
    }) ERR_SAVING_PROPOSAL))
))

(define-public (vote-on-proposal (proposal <proposal-trait>) (vote bool))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get startBlockStx proposalRecord))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      (senderBalance (unwrap! (at-block proposalBlockHash (contract-call? .aibtc-token get-balance tx-sender)) ERR_FETCHING_TOKEN_DATA))
    )
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtc-base-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal is still active
    (asserts! (>= burn-block-height (get startBlock proposalRecord)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get endBlock proposalRecord)) ERR_VOTE_TOO_LATE)
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; vote not already cast
    (asserts! (is-none (map-get? VotingRecords {proposal: proposalContract, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print vote event
    (print {
      notification: "vote-on-proposal",
      payload: {
        proposal: proposalContract,
        contractCaller: contract-caller,
        voter: tx-sender,
        amount: senderBalance,
        vote: vote
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

(define-public (conclude-proposal (proposal <proposal-trait>))
  (let
    (
      (proposalContract (contract-of proposal))
      (proposalRecord (unwrap! (map-get? Proposals proposalContract) ERR_PROPOSAL_NOT_FOUND))
      ;; if VOTING_QUORUM <= ((votesFor * 100) / liquidTokens)
      (votePassed (<= VOTING_QUORUM (/ (* (get votesFor proposalRecord) u100) (get liquidTokens proposalRecord))))
    )
    ;; proposal was not already executed
    (asserts! (is-none (contract-call? .aibtc-base-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    ;; proposal past end block height
    (asserts! (>= burn-block-height (get endBlock proposalRecord)) ERR_PROPOSAL_STILL_ACTIVE)
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; print conclusion event
    (print {
      notification: "conclude-proposal",
      payload: {
        proposal: proposalContract,
        passed: votePassed,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    ;; update the proposal record
    (map-set Proposals proposalContract
      (merge proposalRecord {
        concluded: true,
        passed: votePassed
      })
    )
    ;; execute the proposal only if it passed
    (and votePassed (try! (contract-call? .aibtc-base-dao execute proposal tx-sender)))
    ;; return the result
    (ok votePassed)
  )
)

;; read only functions
;;

(define-read-only (get-voting-power (who principal) (proposal <proposal-trait>))
  (let
    (
      (proposalRecord (unwrap! (map-get? Proposals (contract-of proposal)) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlockHash (unwrap! (get-block-hash (get startBlockStx proposalRecord)) ERR_RETRIEVING_START_BLOCK_HASH))
    )
    (at-block proposalBlockHash (contract-call? .aibtc-token get-balance who))
  )
)

(define-read-only (get-linked-voting-contracts)
  {
    treasury: VOTING_TREASURY,
    token-dex: VOTING_TOKEN_DEX,
    token-pool: VOTING_TOKEN_POOL
  }
)

(define-read-only (get-proposal (proposal principal))
  (map-get? Proposals proposal)
)

(define-read-only (get-total-votes (proposal principal) (voter principal))
  (default-to u0 (map-get? VotingRecords {proposal: proposal, voter: voter}))
)

(define-read-only (get-voting-period)
  VOTING_PERIOD
)

(define-read-only (get-voting-quorum)
  VOTING_QUORUM
)

;; private functions
;; 

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (get-block-hash (blockHeight uint))
  (get-block-info? id-header-hash blockHeight)
)

(define-private (get-liquid-supply (blockHeight uint))
  (let
    (
      (blockHash (unwrap! (get-block-hash blockHeight) ERR_RETRIEVING_START_BLOCK_HASH))
      (totalSupply (unwrap! (at-block blockHash (contract-call? .aibtc-token get-total-supply)) ERR_FETCHING_TOKEN_DATA))
      (dexBalance (unwrap! (at-block blockHash (contract-call? .aibtc-token get-balance VOTING_TOKEN_DEX)) ERR_FETCHING_TOKEN_DATA))
      (poolBalance (unwrap! (at-block blockHash (contract-call? .aibtc-token get-balance VOTING_TOKEN_POOL)) ERR_FETCHING_TOKEN_DATA))
      (treasuryBalance (unwrap! (at-block blockHash (contract-call? .aibtc-token get-balance VOTING_TREASURY)) ERR_FETCHING_TOKEN_DATA))
    )
    (ok (- totalSupply (+ dexBalance poolBalance treasuryBalance)))
  )
)
