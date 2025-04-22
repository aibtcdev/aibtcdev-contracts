;; title: aibtc-action-pmt-stx-add-resource
;; version: 1.0.0
;; summary: A predefined action to add a resource in the STX payment processor extension.

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

(define-constant CFG_MESSAGE "Executed Action Proposal: Added a resource in the STX payment processor extension")

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (paramsTuple (unwrap! (from-consensus-buff?
        { name: (string-utf8 50), description: (string-utf8 255), price: uint, url: (optional (string-utf8 255)) }
        parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (try! (contract-call? .aibtc-payment-processor-stx add-resource (get name paramsTuple) (get description paramsTuple) (get price paramsTuple) (get url paramsTuple)))
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
