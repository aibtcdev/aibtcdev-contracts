(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; withdraws an NFT from the treasury
  (contract-call? .aibtc-treasury withdraw-nft 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.aibtc-nft u1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
