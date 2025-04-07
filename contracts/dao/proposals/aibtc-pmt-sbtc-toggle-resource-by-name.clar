(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by name in the BTC payment processor")
(define-constant CFG_RESOURCE_NAME u"example-resource")

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; toggle a resource enabled status by name
    (contract-call? .aibtc-payment-processor-sbtc toggle-resource-by-name CFG_RESOURCE_NAME)
  )
)
