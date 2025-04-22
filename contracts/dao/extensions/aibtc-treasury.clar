;; title: aibtc-treasury
;; version: 2.0.0
;; summary: TBD

;; traits
;;
(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.treasury)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; constants
;;

;; contract names
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; track periods by BTC block height
(define-constant PERIOD_BPS u200) ;; 2% of own supply
(define-constant PERIOD_LENGTH u4320) ;; 30 days

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u6000))
(define-constant ERR_UNKNOWN_ASSSET (err u6001))
(define-constant ERR_PERIOD_ALREADY_CLAIMED (err u6002))

;; template variables
;;

;; /g/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_token_contract
(define-constant CFG_SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token)
;; /g/.aibtc-token/dao_token_contract
(define-constant CFG_DAO_TOKEN .aibtc-token)
;; /g/.aibtc-operating-fund/operating_fund_contract
(define-constant CFG_OPERATING_FUND .aibtc-operating-fund)

;; data maps
;;

;; track allowed assets for deposit/transfer
(define-map AllowedAssets principal bool)

;; track transfers per period
(define-map StxClaims
  uint ;; period
  bool ;; claimed
)
(define-map FtClaims
  { contract: principal, period: uint }
  bool ;; claimed
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

;; add or update an asset to the allowed list
(define-public (allow-asset (token principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "treasury-allow-asset",
      payload: {
        token: token,
        enabled: enabled,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (map-set AllowedAssets token enabled))
  )
)

;; deposit STX to the treasury
(define-public (deposit-stx (amount uint))  
  (begin
    ;; no auth - anyone can deposit
    (print {
      notification: "treasury-deposit-stx",
      payload: {
        amount: amount,
        recipient: SELF,
        contractCaller: contract-caller,
        txSender: tx-sender,
      }
    })
    (stx-transfer? amount tx-sender SELF)
  )
)

;; deposit FT to the treasury
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    ;; no auth - anyone can deposit if token allowed
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "treasury-deposit-ft",
      payload: {
        amount: amount,
        recipient: SELF,
        assetContract: (contract-of ft),
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (contract-call? ft transfer amount tx-sender SELF none)
  )
)

;; transfer STX from treasury to operating fund
;; TODO - determine amount as 2% of balance
(define-public (transfer-stx-to-operating-fund)
  (let
    (
      (amount u0)
    )
    (try! (is-dao-or-extension))
    (try! (update-claim-stx))
    (print {
      notification: "treasury-transfer-stx-to-operating-fund",
      payload: {
        recipient: CFG_OPERATING_FUND,
        contractCaller: contract-caller,
        txSender: tx-sender,
      }
    })
    (as-contract (stx-transfer? amount SELF CFG_OPERATING_FUND))
  )
)

;; transfer FT from treasury to operating fund
(define-public (transfer-ft-to-operating-fund (ft <ft-trait>))
  (let
    (
      (assetContract (contract-of ft))
      (amount u0)
    )
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset assetContract) ERR_UNKNOWN_ASSSET)
    (try! (update-claim-ft assetContract))
    (print {
      notification: "treasury-transfer-ft-to-operating-fund",
      payload: {
        amount: amount,
        assetContract: assetContract,
        recipient: CFG_OPERATING_FUND,
        contractCaller: contract-caller,
        txSender: tx-sender,
      }
    })
    (as-contract (contract-call? ft transfer amount SELF CFG_OPERATING_FUND none))
  )
)

;; delegate STX for stacking
(define-public (delegate-stx (maxAmount uint) (to principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "delegate-stx",
      payload: {
        amount: maxAmount,
        contractCaller: contract-caller,
        delegate: to,
        txSender: tx-sender
      }
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox-4 delegate-stx maxAmount to none none))
      success (ok success)
      err (err (to-uint err))
    )
  )
)

;; revoke STX delegation, STX unlocks after cycle ends
(define-public (revoke-delegate-stx)
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "revoke-delegate-stx",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox-4 revoke-delegate-stx))
      success (begin (print success) (ok true))
      err (err (to-uint err))
    )
  )
)

;; read only functions
;;

(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssets assetContract)
)

(define-read-only (get-current-period)
  (/ (- burn-block-height DEPLOYED_BURN_BLOCK) PERIOD_LENGTH)
)

(define-read-only (get-claim-stx (period uint))
  (map-get? StxClaims period)
)

(define-read-only (get-claim-ft (assetContract principal) (period uint))
  (map-get? FtClaims { contract: assetContract, period: period })
)

(define-read-only (get-contract-info)
  (let
    (
      (currentPeriod (get-current-period))
      (lastPeriod (if (> currentPeriod u0) (- currentPeriod u1) u0))
    )
    ;; return contract info object
    {
      self: SELF,
      deployedBurnBlock: DEPLOYED_BURN_BLOCK,
      deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
      periodBps: PERIOD_BPS,
      periodLength: PERIOD_LENGTH,
      lastPeriod: {
        period: lastPeriod,
        btcClaimed: (get-claim-ft CFG_SBTC_TOKEN lastPeriod),
        daoClaimed: (get-claim-ft CFG_DAO_TOKEN lastPeriod),
        stxClaimed: (get-claim-stx lastPeriod),
      },
      currentPeriod: {
        period: currentPeriod,
        btcClaimed: (get-claim-ft CFG_SBTC_TOKEN currentPeriod),
        daoClaimed: (get-claim-ft CFG_DAO_TOKEN currentPeriod),
        stxClaimed: (get-claim-stx currentPeriod),
      },
    }
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

;; helper that will update the claim status for STX
;; and error if the period was already claimed
(define-private (update-claim-stx)
  (begin
    (print {
      notification: "treasury-update-claim-stx",
      payload: {
        period: (get-current-period),
        claimed: true,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (asserts!
      (map-insert StxClaims (get-current-period) true)
      ERR_PERIOD_ALREADY_CLAIMED
    ))
  )
)

;; helper that will update the claim status for FT
;; and error if the period was already claimed
(define-private (update-claim-ft (assetContract principal))
  (begin
    (print {
      notification: "treasury-update-claim-ft",
      payload: {
        period: (get-current-period),
        claimed: true,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (asserts!
      (map-insert FtClaims { contract: contract-caller, period: (get-current-period) } true)
      ERR_PERIOD_ALREADY_CLAIMED
    ))
  )
)
