(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.action)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))

(define-constant CFG_MESSAGE "Executed Action Proposal: Updated configuration in timed vault extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (paramsTuple (unwrap! (from-consensus-buff?
        { accountHolder: (optional principal), amount: (optional uint), period: (optional uint) }
        parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (and (is-some (get accountHolder paramsTuple))
      (try! (contract-call? .aibtc-timed-vault set-account-holder (unwrap-panic (get accountHolder paramsTuple))))
    )
    (and (is-some (get amount paramsTuple))
      (let ((amount (unwrap-panic (get amount paramsTuple))))
        ;; verify within limits for low quorum
        (asserts! (and (> amount u0) (< amount u100000000)) ERR_INVALID_PARAMS)
        (try! (contract-call? .aibtc-timed-vault set-withdrawal-amount (unwrap-panic (get amount paramsTuple))))
      )
    )
    (and (is-some (get period paramsTuple))
      (let ((period (unwrap-panic (get period paramsTuple))))
        ;; verify within limits for low quorum
        (asserts! (and (> period u6) (< period u8064)) ERR_INVALID_PARAMS)
        (try! (contract-call? .aibtc-timed-vault set-withdrawal-period (unwrap-panic (get period paramsTuple))))
      )
    )
    (ok true)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
