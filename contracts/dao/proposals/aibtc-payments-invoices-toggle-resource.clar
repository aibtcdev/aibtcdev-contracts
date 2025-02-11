(impl-trait .aibtc-dao-traits-v2.proposal)

(define-public (execute (sender principal))
  ;; toggles enabled status for resource by index
  (contract-call? .aibtc-payments-invoices toggle-resource u1)
)
