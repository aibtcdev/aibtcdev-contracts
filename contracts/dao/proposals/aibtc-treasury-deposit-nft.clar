(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; deposits an NFT to the treasury
  (contract-call? .aibtc-treasury deposit-nft 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.aibtc-nft u1)
)
