(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; pays an invoice for a resource by name
  (contract-call? .aibtc-payments-invoices pay-invoice-by-resource-name u"example-resource" none)
)
