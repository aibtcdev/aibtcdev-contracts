(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; deposits fungible tokens to the treasury
  (contract-call? .aibtc-treasury deposit-ft 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.abtc u1000)
)
