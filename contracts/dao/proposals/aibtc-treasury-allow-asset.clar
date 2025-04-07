(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Allowed asset for use in the treasury extension")
(define-constant CFG_ASSET 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fake-token-1)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; allow an asset for deposit and withdrawal in the treasury
    (contract-call? .aibtc-treasury allow-asset CFG_ASSET true)
  )
)
