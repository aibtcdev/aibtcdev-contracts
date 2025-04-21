;; title: aibtc-treasury
;; version: 1.0.0
;; summary: An extension that manages STX, SIP-009 NFTs, and SIP-010 FTs.

;; traits
;;
(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.treasury)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; constants
;;

(define-constant TREASURY (as-contract tx-sender))
;; /g/.aibtc-operating-fund/operating_fund_contract
(define-constant OPERATING_FUND .aibtc-operating-fund)
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u6000))
(define-constant ERR_UNKNOWN_ASSSET (err u6001))

;; data maps
;;

;; track allowed assets
(define-map AllowedAssets principal bool)
;; track claims per period
(define-map StxClaims uint bool)
(define-map FtClaims uint bool)

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
      notification: "allow-asset",
      payload: {
        enabled: enabled,
        token: token,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (map-set AllowedAssets token enabled))
  )
)

;; add or update a list of assets to the allowed list
(define-public (allow-assets (allowList (list 100 {token: principal, enabled: bool})))
  (begin
    (try! (is-dao-or-extension))
    (map allow-assets-iter allowList)
    (ok true)
  )
)

;; deposit STX to the treasury
(define-public (deposit-stx (amount uint))
  (begin
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        contractCaller: contract-caller,
        recipient: SELF,
        txSender: tx-sender,
        balance: (stx-get-balance SELF)
      }
    })
    (stx-transfer? amount tx-sender SELF)
  )
)

;; deposit FT to the treasury
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "deposit-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        contractCaller: contract-caller,
        recipient: SELF,
        txSender: tx-sender
      }
    })
    (contract-call? ft transfer amount tx-sender SELF none)
  )
)

;; deposit NFT to the treasury
(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (begin
    (asserts! (is-allowed-asset (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "deposit-nft",
      payload: {
        assetContract: (contract-of nft),
        contractCaller: contract-caller,
        recipient: SELF,
        txSender: tx-sender,
        tokenId: id
      }
    })
    (contract-call? nft transfer id tx-sender SELF)
  )
)

;; withdraw STX from the treasury
(define-public (withdraw-stx (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: amount,
        contractCaller: contract-caller,
        recipient: OPERATING_FUND,
        txSender: tx-sender,
        balance: (stx-get-balance SELF)
      }
    })
    (as-contract (stx-transfer? amount SELF OPERATING_FUND))
  )
)

;; withdraw FT from the treasury
(define-public (withdraw-ft (ft <ft-trait>) (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "withdraw-ft",
      payload: {
        assetContract: (contract-of ft),
        contractCaller: contract-caller,
        recipient: OPERATING_FUND,
        txSender: tx-sender,
        amount: amount
      }
    })
    (as-contract (contract-call? ft transfer amount SELF OPERATING_FUND none))
  )
)

;; withdraw NFT from the treasury
(define-public (withdraw-nft (nft <nft-trait>) (id uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "withdraw-nft",
      payload: {
        assetContract: (contract-of nft),
        contractCaller: contract-caller,
        recipient: recipient,
        txSender: tx-sender,
        tokenId: id,
        amount: u1
      }
    })
    (as-contract (contract-call? nft transfer id SELF recipient))
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

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (allow-assets-iter (item {token: principal, enabled: bool}))
  (begin
    (print {
      notification: "allow-asset",
      payload: {
        enabled: (get enabled item),
        token: (get token item),
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (map-set AllowedAssets (get token item) (get enabled item))
  )
)

