(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added a new resource available in the BTC payment processor")
(define-constant CFG_RESOURCE_NAME u"example-resource")
(define-constant CFG_RESOURCE_DESCRIPTION u"An example resource")
(define-constant CFG_RESOURCE_AMOUNT u1000000) ;; 0.01 BTC (8 decimals)
(define-constant CFG_RESOURCE_URL (some u"https://example.com")) ;; or none

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; add a resource to the payments contract
    (try! (contract-call? .aibtc-payment-processor-sbtc add-resource CFG_RESOURCE_NAME CFG_RESOURCE_DESCRIPTION CFG_RESOURCE_AMOUNT CFG_RESOURCE_URL))
    (ok true)
  )
)
