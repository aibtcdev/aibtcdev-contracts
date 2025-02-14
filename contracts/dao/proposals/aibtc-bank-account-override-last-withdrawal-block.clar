(impl-trait .aibtcdev-dao-traits-v1.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Override last withdrawal block")
(define-constant CFG_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)
(define-constant CFG_LAST_WITHDRAWAL_BLOCK burn-block-height)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; override last withdrawal block in the bank account
    (contract-call? CFG_BANK_ACCOUNT_EXTENSION override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK)
  )
)
