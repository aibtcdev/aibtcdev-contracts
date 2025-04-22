;; title: aibtc-operating-fund
;; version: 2.0.0
;; summary: TBD

;; this contract receives 2% of total supply at launch
;; this contract can receive DAO token, sBTC or STX from treasury
;; this contract can fund a timed vault when initialized

;; traits
;;
(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.operating-fund)

;; constants
;;

(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u9000)) ;; TBD/check

;; template variables
;;
;; /g/find/replace

;; data maps
;;

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

;; read only functions
;;

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
