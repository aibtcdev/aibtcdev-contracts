;; title: aibtc-user-agent-account
;; version: 1.0.0
;; summary: A special account contract between a user and an agent for managing assets and DAO interactions. Only the user can withdraw funds.

;; traits
(impl-trait .aibtc-user-agent-account-traits.aibtc-account)
(impl-trait .aibtc-user-agent-account-traits.aibtc-proposals-v3)
(impl-trait .aibtc-user-agent-account-traits.faktory-dex-approval)
(impl-trait .aibtc-user-agent-account-traits.faktory-buy-sell)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait action-trait .aibtc-dao-traits-v3.action)
(use-trait proposal-trait .aibtc-dao-traits-v3.proposal)
(use-trait action-proposals-trait .aibtc-dao-traits-v3.action-proposals)
(use-trait core-proposals-trait .aibtc-dao-traits-v3.core-proposals)
(use-trait dao-faktory-dex .aibtc-dao-traits-v3.faktory-dex)
(use-trait faktory-token .faktory-trait-v1.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; owner and agent addresses
;; /g/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner
(define-constant ACCOUNT_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; owner (user/creator of account, full access)
;; /g/ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent
(define-constant ACCOUNT_AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; agent (can only take approved actions)

;; pre-approved contracts
;; /g/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token
;; /g/.aibtc-token/dao_token_contract
(define-constant DAO_TOKEN .aibtc-token) ;; DAO token
;; /g/.aibtc-token-dex/dao_token_dex_contract
(define-constant DAO_TOKEN_DEX .aibtc-token-dex) ;; DAO token DEX

;; error codes
(define-constant ERR_UNAUTHORIZED (err u9000))
(define-constant ERR_UNKNOWN_ASSET (err u9001))
(define-constant ERR_OPERATION_FAILED (err u9002))
(define-constant ERR_BUY_SELL_NOT_ALLOWED (err u9003))

;; data maps
(define-map ApprovedAssets principal bool)
(define-map ApprovedDexes principal bool)

;; data vars
(define-data-var agentCanBuySell bool false)

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
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: amount,
        sender: SELF,
        caller: contract-caller,
        recipient: ACCOUNT_OWNER
      }
    })
    (as-contract (stx-transfer? amount SELF ACCOUNT_OWNER))
  )
)

(define-public (withdraw-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "withdraw-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: SELF,
        caller: contract-caller,
        recipient: ACCOUNT_OWNER
      }
    })
    (as-contract (contract-call? ft transfer amount SELF ACCOUNT_OWNER none))
  )
)

(define-public (approve-asset (asset principal))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
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
    (asserts! (is-owner) ERR_UNAUTHORIZED)
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

(define-public (acct-propose-action (action-proposals <action-proposals-trait>) (action <action-trait>) (parameters (buff 2048)) (memo (optional (string-ascii 1024))))
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "acct-propose-action",
      payload: {
        proposalContract: (contract-of action-proposals),
        action: (contract-of action),
        parameters: parameters,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? action-proposals propose-action action parameters memo))
  )
)

(define-public (acct-create-proposal (core-proposals <core-proposals-trait>) (proposal <proposal-trait>) (memo (optional (string-ascii 1024))))
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "acct-create-proposal",
      payload: {
        proposalContract: (contract-of core-proposals),
        proposal: (contract-of proposal),
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? core-proposals create-proposal proposal memo))
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

(define-public (acct-buy-asset (faktory-dex <dao-faktory-dex>) (asset <faktory-token>) (amount uint))
  (begin
    (asserts! (buy-sell-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "acct-buy-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: (contract-of asset),
        amount: amount,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? faktory-dex buy asset amount))
  )
)

(define-public (acct-sell-asset (faktory-dex <dao-faktory-dex>) (asset <faktory-token>) (amount uint))
  (begin
    (asserts! (buy-sell-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "acct-sell-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: (contract-of asset),
        amount: amount,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (as-contract (contract-call? faktory-dex sell asset amount))
  )
)

(define-public (acct-approve-dex (faktory-dex <dao-faktory-dex>))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "acct-approve-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        approved: true,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) true))
  )
)

(define-public (acct-revoke-dex (faktory-dex <dao-faktory-dex>))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "acct-revoke-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        approved: false,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) false))
  )
)

(define-public (set-agent-can-buy-sell (canBuySell bool))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "set-agent-can-buy-sell",
      payload: {
        canBuySell: canBuySell,
        sender: tx-sender,
        caller: contract-caller
      }
    })
    (ok (var-set agentCanBuySell canBuySell))
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
    account: SELF,
    agent: ACCOUNT_AGENT,
    owner: ACCOUNT_OWNER,
    daoToken: DAO_TOKEN,
    daoTokenDex: DAO_TOKEN_DEX,
    sbtcToken: SBTC_TOKEN,
  }
)

;; private functions

(define-private (is-authorized)
  (or (is-eq contract-caller ACCOUNT_OWNER) (is-eq contract-caller ACCOUNT_AGENT))
)

(define-private (is-owner)
  (is-eq contract-caller ACCOUNT_OWNER)
)

(define-private (is-agent)
  (is-eq contract-caller ACCOUNT_AGENT)
)

(define-private (buy-sell-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanBuySell)))
)

;; initialize approved contracts
(map-set ApprovedAssets SBTC_TOKEN true)
(map-set ApprovedAssets DAO_TOKEN true)
(map-set ApprovedDexes DAO_TOKEN_DEX true)

;; print creation event
(print {
  notification: "user-agent-account-created",
  payload: (get-configuration)
})
