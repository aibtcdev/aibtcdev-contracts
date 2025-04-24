;; title: aibtc-action-treasury-allow-asset
;; version: 1.0.0
;; summary: A predefined action to allow or enable an asset for use in the treasury.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.action)

;; constants
;;

(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1100))
(define-constant ERR_INVALID_PARAMS (err u1101))

;; template variables
;;

(define-constant CFG_MESSAGE "Executed Action Proposal: Allowed or updated asset for use in the treasury") 

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (asset (unwrap! (from-consensus-buff? principal parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (contract-call? .aibtc-treasury allow-asset asset true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
