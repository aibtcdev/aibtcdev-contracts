;; title: aibtcdev-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait .aibtcdev-dao-traits-v1.extension)
(impl-trait .aibtcdev-dao-traits-v1.messaging)

;; constants
;;
(define-constant INPUT_ERROR (err u400))
(define-constant ERR_UNAUTHORIZED (err u2000))

;; public functions

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)) (isFromDao bool))
  (begin
    (and isFromDao (try! (is-dao-or-extension)))
    (asserts! (> (len msg) u0) INPUT_ERROR)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message
    (print {
      notification: "send",
      payload: {
        caller: contract-caller,
        height: block-height,
        isFromDao: isFromDao,
        sender: tx-sender,
      }
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)