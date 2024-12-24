;; test treasury contract implementing treasury trait
(impl-trait .aibtcdev-dao-traits-v1.treasury)

(define-public (deposit-stx (amount uint))
  (ok true)
)

(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (ok true)
)

(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (ok true)
)

(define-public (withdraw-stx (amount uint) (recipient principal))
  (ok true)
)

(define-public (withdraw-ft (ft <ft-trait>) (amount uint) (recipient principal))
  (ok true)
)

(define-public (withdraw-nft (nft <nft-trait>) (id uint) (recipient principal))
  (ok true)
)

(define-public (delegate-stx (maxAmount uint) (to principal))
  (ok true)
)

(define-public (revoke-delegate-stx)
  (ok true)
)
