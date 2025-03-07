;; title: aibtc-user-agent-vault
;; version: 1.0.0
;; summary: A vault contract between a user and an agent for managing assets and DAO interactions

;; traits
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait action-trait .aibtc-dao-traits-v2.action)
(use-trait proposal-trait .aibtc-dao-traits-v2.proposal)
(use-trait action-proposals-trait .aibtc-dao-traits-v2.action-proposals)
(use-trait core-proposals-trait .aibtc-dao-traits-v2.core-proposals)

;; constants
(define-constant USER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; Default user for testing
(define-constant AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; Default agent for testing
(define-constant VAULT (as-contract tx-sender))

;; Pre-approved tokens
(define-constant SBTC_TOKEN 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.test-token) ;; Placeholder for sBTC
(define-constant DAO_TOKEN .aibtc-token) ;; DAO token

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_UNKNOWN_ASSET (err u1001))
(define-constant ERR_OPERATION_FAILED (err u1002))

;; data maps
(define-map ApprovedAssets principal bool)

;; public functions

;; Asset Management Functions

(define-public (deposit-stx (amount uint))
  (begin
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        sender: tx-sender,
        caller: contract-caller,
        recipient: VAULT
      }
    })
    (stx-transfer? amount tx-sender VAULT)
  )
)

(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "deposit-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: tx-sender,
        caller: contract-caller,
        recipient: VAULT
      }
    })
    (contract-call? ft transfer amount tx-sender VAULT none)
  )
)

(define-public (withdraw-stx (amount uint))
  (begin
    (try! (is-user))
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: amount,
        sender: VAULT,
        caller: contract-caller,
        recipient: USER
      }
    })
    (as-contract (stx-transfer? amount VAULT USER))
  )
)

(define-public (withdraw-ft (ft <ft-trait>) (amount uint))
  (begin
    (try! (is-user))
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "withdraw-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: VAULT,
        caller: contract-caller,
        recipient: USER
      }
    })
    (as-contract (contract-call? ft transfer amount VAULT USER none))
  )
)

(define-public (approve-asset (asset principal))
  (begin
    (try! (is-user))
    (print {
      notification: "approve-asset",
      payload: {
        asset: asset,
        approved: true,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedAssets asset true))
  )
)

(define-public (revoke-asset (asset principal))
  (begin
    (try! (is-user))
    (print {
      notification: "revoke-asset",
      payload: {
        asset: asset,
        approved: false,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedAssets asset false))
  )
)

;; DAO Interaction Functions

(define-public (proxy-propose-action (action-proposals <action-proposals-trait>) (action <action-trait>) (parameters (buff 2048)))
  (begin
    (try! (is-authorized))
    (print {
      notification: "proxy-propose-action",
      payload: {
        action-proposals: (contract-of action-proposals),
        action: (contract-of action),
        parameters: parameters,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? action-proposals propose-action action parameters))
  )
)

(define-public (proxy-create-proposal (core-proposals <core-proposals-trait>) (proposal <proposal-trait>))
  (begin
    (try! (is-authorized))
    (print {
      notification: "proxy-create-proposal",
      payload: {
        core-proposals: (contract-of core-proposals),
        proposal: (contract-of proposal),
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? core-proposals create-proposal proposal))
  )
)

(define-public (vote-on-action-proposal (action-proposals <action-proposals-trait>) (proposalId uint) (vote bool))
  (begin
    (try! (is-authorized))
    (print {
      notification: "vote-on-action-proposal",
      payload: {
        action-proposals: (contract-of action-proposals),
        proposalId: proposalId,
        vote: vote,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? action-proposals vote-on-proposal proposalId vote))
  )
)

(define-public (vote-on-core-proposal (core-proposals <core-proposals-trait>) (proposal <proposal-trait>) (vote bool))
  (begin
    (try! (is-authorized))
    (print {
      notification: "vote-on-core-proposal",
      payload: {
        core-proposals: (contract-of core-proposals),
        proposal: (contract-of proposal),
        vote: vote,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? core-proposals vote-on-proposal proposal vote))
  )
)

(define-public (conclude-action-proposal (action-proposals <action-proposals-trait>) (proposalId uint) (action <action-trait>))
  (begin
    (try! (is-authorized))
    (print {
      notification: "conclude-action-proposal",
      payload: {
        action-proposals: (contract-of action-proposals),
        proposalId: proposalId,
        action: (contract-of action),
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? action-proposals conclude-proposal proposalId action))
  )
)

(define-public (conclude-core-proposal (core-proposals <core-proposals-trait>) (proposal <proposal-trait>))
  (begin
    (try! (is-authorized))
    (print {
      notification: "conclude-core-proposal",
      payload: {
        core-proposals: (contract-of core-proposals),
        proposal: (contract-of proposal),
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? core-proposals conclude-proposal proposal))
  )
)

;; read only functions

(define-read-only (is-approved-asset (asset principal))
  (default-to false (map-get? ApprovedAssets asset))
)

(define-read-only (get-balance-stx)
  (stx-get-balance VAULT)
)

;; private functions

(define-private (is-authorized)
  (if (or (is-eq tx-sender USER) (is-eq tx-sender AGENT))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-private (is-user)
  (if (is-eq tx-sender USER)
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; initialize approved assets
(map-set ApprovedAssets SBTC_TOKEN true)
(map-set ApprovedAssets DAO_TOKEN true)
