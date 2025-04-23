;; title: aibtc-operating-fund
;; version: 1.0.0
;; summary: A registry for the DAO that tracks common values used by DAO contracts.

;; TODO - remove notes
;; tracks current epoch since deployment
;; tracks allowed assets within the dao
;; tracks users that interact at the dao level

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
;; TODO - add dao-registry trait
;; (impl-trait .aibtc-dao-traits-v3.dao-registry)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; track epochs by BTC block height
(define-constant EPOCH_LENGTH u4320) ;; 30 days in BTC blocks

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u11000))

;; template variables
;;
;; /g/find/replace

;; data maps
;;

;; track allowed assets for use with the DAO
(define-map AllowedAssetContracts principal bool)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

;; enable or disable asset on the allowed list
(define-public (configure-dao-asset (assetContract principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "dao-registry-configure-dao-asset",
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

;; returns ok if the caller is the DAO or an extension or err if not
(define-read-only (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

;; returns boolean if the asset is allowed
(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

;; returns (some boolean) if the asset is registered or none if unknown
(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssetContracts assetContract)
)

;; returns the current epoch since deployment
(define-read-only (get-current-dao-epoch)
  (/ (- burn-block-height DEPLOYED_BURN_BLOCK) EPOCH_LENGTH)
)

;; returns the epoch length
(define-read-only (get-dao-epoch-length)
  EPOCH_LENGTH
)