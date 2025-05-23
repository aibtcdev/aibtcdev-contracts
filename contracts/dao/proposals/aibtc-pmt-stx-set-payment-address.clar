(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Updated the payment address in the STX payment processor")
(define-constant CFG_PAYOUT_ADDRESS .aibtc-timed-vault-stx)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? .aibtc-payment-processor-stx set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
