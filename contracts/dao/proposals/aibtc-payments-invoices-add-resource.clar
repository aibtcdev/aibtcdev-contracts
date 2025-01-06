(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; adds a resource that can be used to pay invoices
  (contract-call? .aibtc-payments-invoices add-resource "example-resource" "An example resource" u1000000 (some "https://example.com"))
)
