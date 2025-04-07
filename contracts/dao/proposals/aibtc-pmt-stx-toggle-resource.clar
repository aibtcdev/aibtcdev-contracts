(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Toggled a resource status by index in the STX payment processor")
(define-constant CFG_RESOURCE_INDEX u1)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; toggle a resource enabled status by index
    (contract-call? .aibtc-payment-processor-stx toggle-resource CFG_RESOURCE_INDEX)
  )
)
