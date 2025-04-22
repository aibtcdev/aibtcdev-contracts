;; title: aibtc-operating-fund
;; version: 2.0.0
;; summary: An operations fund for the dao with a 2% allocation of the total supply.

;; TODO - remove notes
;; this contract receives 2% of total supply at launch
;; this contract can receive DAO token, sBTC or STX from treasury
;; this contract can fund a timed vault when initialized

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.operating-fund)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u9000)) ;; TBD/check
(define-constant ERR_UNKNOWN_ASSET (err u9001))
(define-constant ERR_FETCHING_ASSET (err u9002))

;; template variables
;;
;; /g/find/replace

;; data maps
;;

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

;; read only functions
;;

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
