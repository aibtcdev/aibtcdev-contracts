(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Set the payment address for invoices")
(define-constant CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices)
(define-constant CFG_PAYOUT_ADDRESS .aibtc-bank-account)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? CFG_PAYMENTS_CONTRACT set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
