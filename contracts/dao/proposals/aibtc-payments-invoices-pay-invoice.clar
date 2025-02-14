(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Pay an invoice for a resource by index")
(define-constant CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices)
(define-constant CFG_RESOURCE_INDEX u1)
(define-constant CFG_MEMO (some 0x)) ;; (some (buff 34)) or none

(define-public (execute (sender principal))
  ;; pays an invoice for a resource by index
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; pays an invoice for a resource by index
    (try! (contract-call? CFG_PAYMENTS_CONTRACT pay-invoice CFG_RESOURCE_INDEX CFG_MEMO))
    (ok true)
  )
)
