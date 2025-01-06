(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; withdraws fungible tokens from the treasury
  (contract-call? .aibtc-treasury withdraw-ft 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.abtc u1000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
