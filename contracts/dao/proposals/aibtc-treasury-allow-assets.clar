(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Allowed multiple assets for use in the treasury extension")
(define-constant CFG_ASSET_LIST (list
  {token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-1, enabled: true}
  {token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-2, enabled: true}
  {token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-3, enabled: true}
  {token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-4, enabled: true}
  {token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-5, enabled: true}
))

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; allow an asset for deposit and withdrawal in the treasury
    (try! (contract-call? .aibtc-treasury allow-assets CFG_ASSET_LIST))
    (ok true)
  )
)
