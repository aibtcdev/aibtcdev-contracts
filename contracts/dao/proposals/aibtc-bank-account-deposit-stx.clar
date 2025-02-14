(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit STX in bank account")
(define-constant CFG_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)
(define-constant CFG_DEPOSIT_AMOUNT u10000000)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; deposit STX in the bank account
    (contract-call? CFG_BANK_ACCOUNT_EXTENSION deposit-stx CFG_DEPOSIT_AMOUNT)
  )
)
