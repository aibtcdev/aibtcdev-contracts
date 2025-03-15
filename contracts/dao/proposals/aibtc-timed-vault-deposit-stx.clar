(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposited STX in the timed vault extension")
(define-constant CFG_DEPOSIT_AMOUNT u10000000)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; deposit STX in the timed vault
    (contract-call? .aibtc-timed-vault deposit-stx CFG_DEPOSIT_AMOUNT) ;; CFG_TIMED_VAULT_CONTRACT
  )
)
