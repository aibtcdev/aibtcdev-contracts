;; title: aibtc-dao-epoch
;; version: 1.0.0
;; summary: An extension that tracks the current epoch of the DAO.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
;; TODO - add dao-epoch trait (impl-trait .aibtc-dao-traits-v3.dao-epoch)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; track epochs by BTC block height
(define-constant EPOCH_LENGTH u4320) ;; 30 days in BTC blocks

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

;; read only functions
;;

;; returns the current epoch based on deployed burn block
(define-read-only (get-current-dao-epoch)
  (/ (- burn-block-height DEPLOYED_BURN_BLOCK) EPOCH_LENGTH)
)

;; returns the epoch length
(define-read-only (get-dao-epoch-length)
  EPOCH_LENGTH
)
