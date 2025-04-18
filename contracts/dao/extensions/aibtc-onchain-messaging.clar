;; title: aibtc-onchain-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.messaging)

;; constants
;;
(define-constant ERR_INVALID_INPUT (err u4000))
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u4001))

;; public functions

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)) (isFromDao bool))
  (begin
    (and isFromDao (try! (is-dao-or-extension)))
    (asserts! (> (len msg) u0) ERR_INVALID_INPUT)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message
    (print {
      notification: "send",
      payload: {
        contractCaller: contract-caller,
        height: stacks-block-height,
        isFromDao: isFromDao,
        txSender: tx-sender,
        messageLength: (len msg)
      }
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
