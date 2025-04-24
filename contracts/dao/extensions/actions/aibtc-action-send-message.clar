;; title: aibtc-action-send-message
;; version: 1.0.0
;; summary: A predefined action to send a message through the onchain messaging system.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.action)

;; constants
;;

(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1100))
(define-constant ERR_INVALID_PARAMS (err u1101))

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (message (unwrap! (from-consensus-buff? (string-ascii 2043) parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (contract-call? .aibtc-onchain-messaging send message true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
