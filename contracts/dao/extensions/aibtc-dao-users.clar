;; title: aibtc-dao-users
;; version: 1.0.0
;; summary: An extension that tracks the current users and their reputation in the DAO.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
;; TODO - add dao-users trait (impl-trait .aibtc-dao-traits-v3.dao-users)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8100)) ;; similar to dao-charter

;; data vars
;;

(define-data-var userCount uint u0) ;; total number of users

;; data maps
;;

;; central tracking for DAO users
(define-map UserIndexes principal uint)
(define-map UserData
  uint ;; user index
  {
    address: principal,
    createdAt: uint,
    reputation: int, ;; increases/decreases from proposal bonds
  }
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (get-or-create-user (address principal))
  (ok true)
)

(define-public (update-user-reputation (address principal) (amount int))
  (ok true)
)

;; read only functions
;;

;; returns the unique user count
(define-read-only (get-user-count)
  (var-get userCount)
)

;; returns (some data) if the user exists or none if unknown
(define-read-only (get-user-index (address principal))
  (map-get? UserIndexes address)
)

;; returns (some data) if the user exists or none if unknown
(define-read-only (get-user-data-by-index (userIndex uint))
  (map-get? UserData userIndex)
)

;; returns (some data) if the user exists or none if unknown
(define-read-only (get-user-data-by-address (address principal))
  (get-user-data-by-index (unwrap! (get-user-index address) none))
)

;; private functions
;;

;; returns ok if the caller is the DAO or an extension or err if not
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)