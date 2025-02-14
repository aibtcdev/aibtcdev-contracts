(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Pay an invoice for a resource by name")
(define-constant CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices)
(define-constant CFG_RESOURCE_NAME u"example-resource")
(define-constant CFG_MEMO (some 0x)) ;; (some (buff 34)) or none


(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; pays an invoice for a resource by name
    (try! (contract-call? CFG_PAYMENTS_CONTRACT pay-invoice-by-resource-name CFG_RESOURCE_NAME CFG_MEMO))
    (ok true)
  )
)
