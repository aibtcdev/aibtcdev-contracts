(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set or updated the account holder in the STX timed vault extension")
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the account holder
    (contract-call? .aibtc-timed-vault-stx set-account-holder CFG_ACCOUNT_HOLDER)
  )
)
