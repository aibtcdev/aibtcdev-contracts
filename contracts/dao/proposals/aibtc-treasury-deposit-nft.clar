(impl-trait .aibtc-dao-traits-v2.proposal)

(define-public (execute (sender principal))
  ;; deposits an NFT to the treasury
  (contract-call? .aibtc-treasury deposit-nft .aibtcdev-airdrop-1 u1)
)
