(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Updated the payment address in the DAO payment processor")
(define-constant CFG_PAYOUT_ADDRESS .aibtc-timed-vault-dao)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the payment address for invoices
    (contract-call? .aibtc-payment-processor-dao set-payment-address CFG_PAYOUT_ADDRESS)
  )
)
