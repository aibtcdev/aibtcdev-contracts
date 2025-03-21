(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by name in the payments/invoices extension")
(define-constant CFG_RESOURCE_NAME u"example-resource")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_PAYMENTS_CONTRACT .aibtc-payments-invoices

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; toggle a resource enabled status by name
    (contract-call? .aibtc-payments-invoices toggle-resource-by-name CFG_RESOURCE_NAME)
  )
)
