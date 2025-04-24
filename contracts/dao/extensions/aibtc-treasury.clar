;; title: aibtc-treasury
;; version: 2.0.0
;; summary: A secure treasury contract that controls the funds of the DAO.

;; traits
;;

(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.treasury)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u6000))
(define-constant ERR_UNKNOWN_ASSET (err u6001))
(define-constant ERR_FETCHING_ASSET (err u6002))
(define-constant ERR_PERIOD_ALREADY_CLAIMED (err u6003))

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; track periods by BTC block height
(define-constant PERIOD_BPS u200) ;; 2% of own supply
(define-constant PERIOD_BPS_DIVISOR u10000) ;; 10000 BP = 100%
(define-constant PERIOD_LENGTH u4320) ;; 30 days in BTC blocks
(define-constant PERIOD_MIN_BTC u100) ;; 0.00000100 BTC or 100 sats (8 decimals)
(define-constant PERIOD_MIN_STX u1000000) ;; 1 STX (6 decimals)

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
  uint ;; claimed amount
)
(define-map FtClaims
  { contract: principal, period: uint }
  uint ;; claimed amount
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

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
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
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
(define-public (transfer-stx-to-operating-fund)
  (let
    (
      (amount (unwrap-panic (get-stx-claim-amount)))
    )
    (try! (is-dao-or-extension))
    (try! (update-claim-stx amount))
    (print {
      notification: "treasury-transfer-stx-to-operating-fund",
      payload: {
        amount: amount,
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
      (amount (try! (get-ft-claim-amount ft)))
    )
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset assetContract) ERR_UNKNOWN_ASSET)
    (try! (update-claim-ft amount assetContract))
    (print {
      notification: "treasury-transfer-ft-to-operating-fund",
      payload: {
        amount: amount,
        recipient: CFG_OPERATING_FUND,
        assetContract: assetContract,
        contractCaller: contract-caller,
        txSender: tx-sender,
      }
    })
    (as-contract (contract-call? ft transfer amount SELF CFG_OPERATING_FUND none))
  )
)

;; delegate STX for stacking
(define-public (delegate-stx (maxAmount uint) (delegateTo principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "treasury-delegate-stx",
      payload: {
        maxAmount: maxAmount,
        delegateTo: delegateTo,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox-4 delegate-stx maxAmount delegateTo none none))
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
      notification: "treasury-revoke-delegate-stx",
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

(define-read-only (get-claim-ft (period uint) (assetContract principal) )
  (map-get? FtClaims { contract: assetContract, period: period })
)

;; TODO: consider splitting dynamic/static info, easier to cache on client side
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
        btcClaimed: (get-claim-ft lastPeriod CFG_SBTC_TOKEN),
        daoClaimed: (get-claim-ft lastPeriod CFG_DAO_TOKEN),
        stxClaimed: (get-claim-stx lastPeriod),
      },
      currentPeriod: {
        period: currentPeriod,
        btcClaimed: (get-claim-ft currentPeriod CFG_SBTC_TOKEN),
        daoClaimed: (get-claim-ft currentPeriod CFG_DAO_TOKEN),
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
(define-private (update-claim-stx (amount uint))
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
      (map-insert StxClaims (get-current-period) amount)
      ERR_PERIOD_ALREADY_CLAIMED
    ))
  )
)

;; helper that will return 2% of the current balance for STX
(define-private (get-stx-claim-amount)
  (let
    (
      (balance (stx-get-balance SELF))
      (claimAmount (/ (* balance PERIOD_BPS) u10000))
    )
    (if (< claimAmount PERIOD_MIN_STX)
      (ok PERIOD_MIN_STX) ;; 1 STX minimum
      (ok claimAmount) ;; 2% of balance
    )
  )
)

;; helper that will update the claim status for FT
;; and error if the period was already claimed
(define-private (update-claim-ft (amount uint) (assetContract principal))
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
      (map-insert FtClaims { contract: contract-caller, period: (get-current-period) } amount)
      ERR_PERIOD_ALREADY_CLAIMED
    ))
  )
)

;; helper that will return 2% of the current balance for FT
(define-private (get-ft-claim-amount (ft <ft-trait>))
  (let
    (
      (balance (unwrap! (contract-call? ft get-balance SELF) ERR_FETCHING_ASSET))
      (decimals (unwrap! (contract-call? ft get-decimals) ERR_FETCHING_ASSET))
      (minAmount (if (is-eq (contract-of ft) CFG_SBTC_TOKEN)
        PERIOD_MIN_BTC ;; 100 sats, specific to BTC
        (pow u10 decimals) ;; 1 whole FT minimum otherwise
      ))
      (claimAmount (/ (* balance PERIOD_BPS) u10000))
    )
    (if (< claimAmount minAmount)
      (ok minAmount) ;; 1 FT minimum
      (ok claimAmount) ;; 2% of balance
    )
  )
)
