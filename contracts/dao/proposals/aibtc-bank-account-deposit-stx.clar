(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit STX in bank account")
(define-constant CFG_DEPOSIT_AMOUNT u10000000)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; deposit STX in the bank account
    (contract-call? .aibtc-bank-account deposit-stx CFG_DEPOSIT_AMOUNT) ;; CFG_BANK_ACCOUNT_CONTRACT
  )
)
