(impl-trait .aibtc-dao-traits-v2.proposal)

(define-public (execute (sender principal))
  ;; adds and enables a new extension to the DAO
  (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account true)
)
