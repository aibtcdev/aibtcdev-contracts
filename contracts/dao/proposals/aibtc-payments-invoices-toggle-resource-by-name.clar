(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggle a resource enabled status by name")
(define-constant CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices)
(define-constant CFG_RESOURCE_NAME u"example-resource")

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; toggle a resource enabled status by name
    (contract-call? CFG_PAYMENTS_CONTRACT toggle-resource-by-name CFG_RESOURCE_NAME)
  )
)
