(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  (contract-call? CFG_BANK_ACCOUNT_EXTENSION set-account-holder CFG_ACCOUNT_HOLDER)
)
