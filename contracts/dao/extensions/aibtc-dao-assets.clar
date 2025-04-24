;; title: aibtc-dao-assets
;; version: 1.0.0
;; summary: An extension that tracks the allowed asset contracts for the DAO.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
;; TODO - add dao-assets trait (impl-trait .aibtc-dao-traits-v3.dao-assets)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8200)) ;; similar to dao-charter

;; data maps
;;

;; central tracking for DAO allowed assets
(define-map AllowedAssetContracts principal bool)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

;; enable or disable asset on the allowed list
(define-public (configure-dao-asset (assetContract principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "dao-assets-configure-dao-asset",
      payload: {
        assetContract: assetContract,
        enabled: enabled,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (map-set AllowedAssetContracts assetContract enabled))
  )
)

;; read only functions
;;

;; returns boolean if the asset is allowed
(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

;; returns (some boolean) if the asset is registered or none if unknown
(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssetContracts assetContract)
)

;; private functions
;;

;; returns ok if the caller is the DAO or an extension or err if not
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)