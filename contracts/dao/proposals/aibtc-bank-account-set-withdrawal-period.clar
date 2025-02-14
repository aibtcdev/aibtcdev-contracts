(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Set bank account withdrawal period")
(define-constant CFG_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)
(define-constant CFG_WITHDRAWAL_PERIOD u144)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; set the withdrawal period
    (contract-call? CFG_BANK_ACCOUNT_EXTENSION set-withdrawal-period CFG_WITHDRAWAL_PERIOD)
  )
)
