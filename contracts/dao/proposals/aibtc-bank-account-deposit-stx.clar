(impl-trait .aibtc-dao-traits-v2.proposal)

(define-public (execute (sender principal))
  (contract-call? .aibtc-bank-account deposit-stx u10000000)
)
