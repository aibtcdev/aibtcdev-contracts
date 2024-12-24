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
    (asserts! (not (is-standard treasuryContract)) ERR_INVALID)
    ;; treasury cannot be the voting contract
    (asserts! (not (is-eq treasuryContract SELF)) ERR_INVALID)
    ;; treasury cannot be the same value
    (asserts! (not (is-eq treasuryContract (var-get protocolTreasury))) ERR_INVALID)
    (ok (var-set protocolTreasury treasuryContract))
  )
)

(define-public (set-voting-token (token <ft-trait>))
  (begin
    (try! (is-dao-or-extension))
    ;; token must be a contract
    (asserts! (not (is-standard (contract-of token))) ERR_INVALID)
    (asserts! (is-eq (var-get votingToken) SELF) ERR_INVALID)
    (asserts! (is-eq (var-get votingToken) (contract-of token)) ERR_INVALID)
    (ok (var-set votingToken (contract-of token)))
  )
)

(define-public (create-proposal (token <ft-trait>) (proposal <proposal-trait>))
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
    (asserts! (> u0 (try! (contract-call? token get-balance tx-sender))) ERR_FETCHING_BALANCE)
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

(define-public (vote-on-proposal)
  (begin 
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    (ok true)
  )
)

(define-public (conclude-proposal)
  (begin
    ;; required variables must be set
    (asserts! (is-initialized) ERR_NOT_INITIALIZED)
    (ok true)
  )
)

;; read only functions
;;

(define-read-only (is-initialized)
  ;; check if the required variables are set
  (not (or
    (is-eq (var-get votingToken) SELF)
    (is-eq (var-get protocolTreasury) SELF)
  ))
)

(define-read-only (get-proposal)
  (ok true)
)

;; private functions
;; 

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
