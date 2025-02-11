(impl-trait .aibtc-dao-traits-v2.proposal)

(define-public (execute (sender principal))
  ;; revokes STX delegation
  (contract-call? .aibtc-treasury revoke-delegate-stx)
)
