;; title: aibtc-action-pmt-sbtc-toggle-resource
;; version: 1.0.0
;; summary: A predefined action to toggle a resource in the BTC payment processor extension.

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

(define-constant CFG_MESSAGE "Executed Action Proposal: Toggled resource status by name in the BTC payment processor extension")

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (resourceName (unwrap! (from-consensus-buff? (string-utf8 50) parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (contract-call? .aibtc-payment-processor-sbtc toggle-resource-by-name resourceName)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
