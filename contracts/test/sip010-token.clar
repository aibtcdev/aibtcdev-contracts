;; test token contract implementing ft trait
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token test-token)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (ok true)
)

(define-read-only (get-name)
  (ok "Test Token")
)

(define-read-only (get-symbol)
  (ok "TEST")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (who principal))
  (ok u0)
)

(define-read-only (get-total-supply)
  (ok u0)
)

(define-read-only (get-token-uri)
  (ok none)
)

;; Test helper functions
(define-public (mint (amount uint) (recipient principal))
  (begin
    (ft-mint? test-token amount recipient)
  )
)
