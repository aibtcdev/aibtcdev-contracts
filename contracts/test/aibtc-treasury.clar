;; test treasury contract implementing treasury trait
(impl-trait .aibtcdev-dao-traits-v1.treasury)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (allow-asset (token principal) (enabled bool))
  (ok true)
)

(define-public (allow-assets (allowList (list 100 {token: principal, enabled: bool})))
  (ok true)
)

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
