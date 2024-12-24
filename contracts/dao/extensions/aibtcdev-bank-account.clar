;; title: aibtcdev-bank-account
;; version: 1.0.0
;; summary: An extension that allows a principal to withdraw STX from the contract with given rules.

;; traits
;;
(impl-trait .aibtcdev-dao-traits-v1.extension)
(impl-trait .aibtcdev-dao-traits-v1.bank-acccount)

;; constants
;;
(define-constant SELF (as-contract tx-sender))
(define-constant ERR_INVALID (err u1000))
(define-constant ERR_UNAUTHORIZED (err u1001))
(define-constant ERR_TOO_SOON (err u1002))
(define-constant ERR_INVALID_AMOUNT (err u1003))


;; data vars
;;
(define-data-var withdrawalPeriod uint u144) ;; 144 Bitcoin blocks, ~1 day
(define-data-var withdrawalAmount uint u10000000) ;; 10,000,000 microSTX, or 10 STX
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
    (asserts! (> block u0) ERR_INVALID)
    (ok (var-set lastWithdrawalBlock block))
  )
)

(define-public (update-terms
    (accountHolder (optional principal)) 
    (withdrawalPeriod (optional uint))
    (withdrawalAmount (optional uint))
    (lastWithdrawalBlock (optional uint))
    (opcode (optional (buff 16))))

  (begin
    ;; Check authorization
    (try! (is-dao-or-extension))

    ;; Update account holder if provided
    (match accountHolder holder
      (begin 
        (asserts! (not (is-eq (var-get accountHolder) holder)) ERR_INVALID)
        (var-set accountHolder holder)
      )
      true
    )

    ;; Update withdrawal period if provided
    (match withdrawalPeriod period
      (begin 
        (asserts! (> period u0) ERR_INVALID)
        (var-set withdrawalPeriod period)
      )
      true
    )

    ;; Update withdrawal amount if provided
    (match withdrawalAmount amount
      (begin
        (asserts! (> amount u0) ERR_INVALID)
        (var-set withdrawalAmount amount)
      )
      true
    )

    ;; Update last withdrawal block if provided
    (match lastWithdrawalBlock block
      (begin
        (asserts! (> block u0) ERR_INVALID)
        (var-set lastWithdrawalBlock block)
      )
      true
    )

    ;; Print settings update event
    (print {
      notification: "terms-updated",
      payload: {
        accountHolder: (var-get accountHolder),
        withdrawalPeriod: (var-get withdrawalPeriod),
        withdrawalAmount: (var-get withdrawalAmount),
        lastWithdrawalBlock: (var-get lastWithdrawalBlock),
        opcode: opcode,
        caller: contract-caller,
        sender: tx-sender
      }
    })

    (ok true)
  )
)

(define-public (deposit-stx (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: SELF
      }
    })
    (stx-transfer? amount contract-caller SELF)
  )
)

(define-public (withdraw-stx)
  (begin
    ;; verify user is enabled in the map
    (try! (is-account-holder))
    ;; verify user is not withdrawing too soon
    (asserts! (>= block-height (+ (var-get lastWithdrawalBlock) (var-get withdrawalPeriod))) ERR_TOO_SOON)
    ;; update last withdrawal block
    (var-set lastWithdrawalBlock block-height)
    ;; print notification and transfer STX
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: (var-get withdrawalAmount),
        caller: contract-caller,
        recipient: (var-get accountHolder)
      }
    })
    (as-contract (stx-transfer? (var-get withdrawalAmount) SELF (var-get accountHolder)))
  )
)

;; read only functions
;;
(define-read-only (get-account-balance)
  (stx-get-balance SELF)
)

(define-read-only (get-account-holder)
  (var-get accountHolder)
)

(define-read-only (get-withdrawal-period)
  (var-get withdrawalPeriod)
)

(define-read-only (get-withdrawal-amount)
  (var-get withdrawalAmount)
)

(define-read-only (get-last-withdrawal-block)
  (var-get lastWithdrawalBlock)
)

(define-read-only (get-terms)
  {
    accountHolder: (var-get accountHolder),
    lastWithdrawalBlock: (var-get lastWithdrawalBlock),
    withdrawalAmount: (var-get withdrawalAmount),
    withdrawalPeriod: (var-get withdrawalPeriod),
  }
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)

(define-private (is-account-holder)
  (ok (asserts! (is-eq (var-get accountHolder) (get-standard-caller)) ERR_UNAUTHORIZED))
)

(define-private (get-standard-caller)
  (let ((d (unwrap-panic (principal-destruct? contract-caller))))
    (unwrap-panic (principal-construct? (get version d) (get hash-bytes d)))
  )
)
