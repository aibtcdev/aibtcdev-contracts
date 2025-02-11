;; title: aibtcdev-token-owner
;; version: 1.0.0
;; summary: An extension that provides management functions for the dao token

;; traits
;;
(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.token-owner)

;; constants
;;

(define-constant ERR_UNAUTHORIZED (err u7000))

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; update token uri
    (try! (as-contract (contract-call? .aibtc-token set-token-uri value)))
    (ok true)
  )
)

;; keeping old format for trait adherance
(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; transfer ownership
    (try! (as-contract (contract-call? .aibtc-token set-contract-owner new-owner)))
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
