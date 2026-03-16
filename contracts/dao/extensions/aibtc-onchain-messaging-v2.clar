;; title: aibtc-onchain-messaging-v2
;; version: 2.0.0
;; summary: An extension to send messages on-chain with soft-fail verification.
;;          Automatically detects if sender is DAO, token holder, or unverified.

;; traits
;;
(impl-trait .aibtc-dao-traits-v4.extension)
(impl-trait .aibtc-dao-traits-v4.messaging)

;; constants
;;
(define-constant ERR_INVALID_INPUT (err u4000))

;; public functions

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)))
  (let
    (
      ;; Soft-fail checks: determine sender type without failing transaction
      (isFromDao (check-is-dao-or-extension))
      (isFromHolder (and (not isFromDao) (check-is-token-holder)))
    )
    (asserts! (> (len msg) u0) ERR_INVALID_INPUT)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message with verified sender flags
    (print {
      notification: "send",
      payload: {
        contractCaller: contract-caller,
        height: stacks-block-height,
        isFromDao: isFromDao,
        isFromHolder: isFromHolder,
        txSender: tx-sender,
        messageLength: (len msg)
      }
    })
    (ok true)
  )
)

;; private functions
;;

;; Soft-fail check: returns true if sender is DAO or extension, false otherwise
(define-private (check-is-dao-or-extension)
  (or
    (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)
  )
)

;; Soft-fail check: returns true if sender holds DAO tokens, false otherwise
;; Returns false if balance check fails (conservative approach)
(define-private (check-is-token-holder)
  (> (get-token-balance tx-sender) u0)
)

;; Helper to get token balance with error handling
;; Returns 0 if the contract call fails
(define-private (get-token-balance (account principal))
  (default-to u0
    (unwrap-panic
      (ok
        (unwrap! (contract-call? .aibtc-token get-balance account) u0)
      )
    )
  )
)
