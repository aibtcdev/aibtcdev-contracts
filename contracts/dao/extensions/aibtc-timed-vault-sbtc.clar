;; title: aibtc-timed-vault
;; version: 1.0.0
;; summary: An extension that allows a principal to withdraw STX from the contract with given rules.

;; traits
;;
(impl-trait .aibtc-dao-traits-v3.extension)
(impl-trait .aibtc-dao-traits-v3.timed-vault)

;; constants
;;
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; template variables
(define-constant CFG_VAULT_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u2000))
(define-constant ERR_INVALID (err u2001))
(define-constant ERR_NOT_ACCOUNT_HOLDER (err u2002))
(define-constant ERR_TOO_SOON (err u2003))
(define-constant ERR_INVALID_AMOUNT (err u2004))
(define-constant ERR_FETCHING_BALANCE (err u2005))


;; data vars
;;
(define-data-var withdrawalPeriod uint u144) ;; 144 Bitcoin blocks, ~1 day
(define-data-var withdrawalAmount uint u10000) ;; 10000 sats, or 0.0001 BTC
(define-data-var lastWithdrawalBlock uint u0)
(define-data-var accountHolder principal SELF)


;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (set-account-holder (new principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (not (is-eq (var-get accountHolder) new)) ERR_INVALID)
    (ok (var-set accountHolder new))
  )
)

(define-public (set-withdrawal-period (period uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> period u0) ERR_INVALID)
    (ok (var-set withdrawalPeriod period))
  )
)

(define-public (set-withdrawal-amount (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> amount u0) ERR_INVALID)
    (ok (var-set withdrawalAmount amount))
  )
)

(define-public (override-last-withdrawal-block (block uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> block DEPLOYED_BURN_BLOCK) ERR_INVALID)
    (ok (var-set lastWithdrawalBlock block))
  )
)

(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (print {
      notification: "deposit",
      payload: {
        amount: amount,
        contractCaller: contract-caller,
        recipient: SELF,
        txSender: tx-sender
      }
    })
    (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer amount tx-sender SELF none)
  )
)

(define-public (withdraw)
  (begin
    ;; verify user is enabled in the map
    (try! (is-account-holder))
    ;; verify user is not withdrawing too soon
    (asserts! (>= burn-block-height (+ (var-get lastWithdrawalBlock) (var-get withdrawalPeriod))) ERR_TOO_SOON)
    ;; update last withdrawal block
    (var-set lastWithdrawalBlock burn-block-height)
    ;; print notification and transfer sBTC
    (print {
      notification: "withdraw",
      payload: {
        amount: (var-get withdrawalAmount),
        contractCaller: contract-caller,
        recipient: (var-get accountHolder),
        txSender: tx-sender,
        withdrawalPeriod: (var-get withdrawalPeriod),
        lastWithdrawalBlock: (var-get lastWithdrawalBlock),
        newLastWithdrawalBlock: burn-block-height
      }
    })
    (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer (var-get withdrawalAmount) SELF (var-get accountHolder) none))
  )
)

;; read only functions
;;
(define-read-only (get-account-balance)
  (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token get-balance SELF)
)

(define-read-only (get-account-terms)
  {
    accountHolder: (var-get accountHolder),
    contractName: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    lastWithdrawalBlock: (var-get lastWithdrawalBlock),
    vaultToken: CFG_VAULT_TOKEN,
    withdrawalAmount: (var-get withdrawalAmount),
    withdrawalPeriod: (var-get withdrawalPeriod),
  }
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (is-account-holder)
  (ok (asserts! (is-eq (var-get accountHolder) (get-standard-caller)) ERR_NOT_ACCOUNT_HOLDER))
)

(define-private (get-standard-caller)
  (let ((d (unwrap-panic (principal-destruct? contract-caller))))
    (unwrap-panic (principal-construct? (get version d) (get hash-bytes d)))
  )
)
