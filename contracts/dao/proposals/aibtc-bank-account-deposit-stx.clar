(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  (contract-call? .aibtcdev-bank-account deposit-stx u10000000)
)
