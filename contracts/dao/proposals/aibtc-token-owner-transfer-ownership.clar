(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_TOKEN_OWNER_CONTRACT .aibtc-token-owner)
(define-constant CFG_NEW_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  ;; transfers ownership of the token uri to a new address
  (contract-call? CFG_TOKEN_OWNER_CONTRACT transfer-ownership CFG_NEW_OWNER)
)
