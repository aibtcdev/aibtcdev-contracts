;; title: aibtc-user-agent-smart-wallet
;; version: 1.0.0
;; summary: A smart wallet contract between a user and an agent for managing assets and DAO interactions

;; traits
(impl-trait .aibtc-smart-wallet-traits.aibtc-smart-wallet)
(impl-trait .aibtc-smart-wallet-traits.aibtc-proposals-v2)
(impl-trait .aibtc-smart-wallet-traits.faktory-buy-sell)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait action-trait .aibtc-dao-traits-v2.action)
(use-trait proposal-trait .aibtc-dao-traits-v2.proposal)
(use-trait action-proposals-trait .aibtc-dao-traits-v2.action-proposals)
(use-trait core-proposals-trait .aibtc-dao-traits-v2.core-proposals)
(use-trait dao-faktory-dex .aibtc-dao-traits-v2.faktory-dex)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))
(define-constant USER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; user (smart wallet owner)
(define-constant AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; agent (proposal voter)

;; Pre-approved tokens
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token
(define-constant DAO_TOKEN .aibtc-token) ;; DAO token

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_UNKNOWN_ASSET (err u1001))
(define-constant ERR_OPERATION_FAILED (err u1002))

;; data maps
(define-map ApprovedAssets principal bool)
(define-map ApprovedDexes principal bool)

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
        recipient: SELF
      }
    })
    (stx-transfer? amount tx-sender SELF)
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
        recipient: SELF
      }
    })
    (contract-call? ft transfer amount tx-sender SELF none)
  )
)

(define-public (withdraw-stx (amount uint))
  (begin
    (asserts! (is-user) ERR_UNAUTHORIZED)
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: amount,
        sender: SELF,
        caller: contract-caller,
        recipient: USER
      }
    })
    (as-contract (stx-transfer? amount SELF USER))
  )
)

(define-public (withdraw-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-user) ERR_UNAUTHORIZED)
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "withdraw-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: SELF,
        caller: contract-caller,
        recipient: USER
      }
    })
    (as-contract (contract-call? ft transfer amount SELF USER none))
  )
)

(define-public (approve-asset (asset principal))
  (begin
    (asserts! (is-user) ERR_UNAUTHORIZED)
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
    (asserts! (is-user) ERR_UNAUTHORIZED)
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "proxy-propose-action",
      payload: {
        proposalContract: (contract-of action-proposals),
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "proxy-create-proposal",
      payload: {
        proposalContract: (contract-of core-proposals),
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "vote-on-action-proposal",
      payload: {
        proposalContract: (contract-of action-proposals),
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "vote-on-core-proposal",
      payload: {
        proposalContract: (contract-of core-proposals),
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "conclude-action-proposal",
      payload: {
        proposalContract: (contract-of action-proposals),
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
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "conclude-core-proposal",
      payload: {
        proposalContract: (contract-of core-proposals),
        proposal: (contract-of proposal),
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? core-proposals conclude-proposal proposal))
  )
)

;; Faktory DEX Trading Functions

(define-public (buy-asset (faktory-dex <dao-faktory-dex>) (asset principal) (amount uint))
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "buy-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: asset,
        amount: amount,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (match (as-contract (contract-call? faktory-dex buy-exact-tokens amount asset))
      success (ok success)
      error (begin
        (print {
          notification: "buy-asset-failed",
          payload: {
            dexContract: (contract-of faktory-dex),
            asset: asset,
            amount: amount,
            error: error
          }
        })
        ERR_OPERATION_FAILED
      ))
    )
  )
)

(define-public (sell-asset (faktory-dex <dao-faktory-dex>) (asset principal) (amount uint))
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "sell-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: asset,
        amount: amount,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (match (as-contract (contract-call? faktory-dex sell-exact-tokens amount asset))
      success (ok success)
      error (begin
        (print {
          notification: "sell-asset-failed",
          payload: {
            dexContract: (contract-of faktory-dex),
            asset: asset,
            amount: amount,
            error: error
          }
        })
        ERR_OPERATION_FAILED
      ))
    )
  )
)

(define-public (approve-dex (faktory-dex <dao-faktory-dex>) (asset principal))
  (begin
    (asserts! (is-user) ERR_UNAUTHORIZED)
    (print {
      notification: "approve-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: asset,
        approved: true,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) true))
  )
)

(define-public (revoke-dex (faktory-dex <dao-faktory-dex>) (asset principal))
  (begin
    (asserts! (is-user) ERR_UNAUTHORIZED)
    (print {
      notification: "revoke-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: asset,
        approved: false,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) false))
  )
)

;; read only functions

(define-read-only (is-approved-asset (asset principal))
  (default-to false (map-get? ApprovedAssets asset))
)

(define-read-only (is-approved-dex (dex principal))
  (default-to false (map-get? ApprovedDexes dex))
)

(define-read-only (get-balance-stx)
  (stx-get-balance SELF)
)

(define-read-only (get-configuration)
  {
    agent: AGENT,
    user: USER,
    smartWallet: SELF,
    daoToken: DAO_TOKEN,
    sbtcToken: SBTC_TOKEN,
  }
)

;; private functions

(define-private (is-authorized)
  (or (is-eq contract-caller USER) (is-eq contract-caller AGENT))
)

(define-private (is-user)
  (is-eq contract-caller USER)
)

;; initialize approved assets
(map-set ApprovedAssets SBTC_TOKEN true)
(map-set ApprovedAssets DAO_TOKEN true)

;; print creation event
(print {
  notification: "smart-wallet-created",
  payload: (get-configuration)
})
