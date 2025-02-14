(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw STX from bank account")
(define-constant CFG_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; withdraw STX from the bank account
    (contract-call? CFG_BANK_ACCOUNT_EXTENSION withdraw-stx)
  )
)
