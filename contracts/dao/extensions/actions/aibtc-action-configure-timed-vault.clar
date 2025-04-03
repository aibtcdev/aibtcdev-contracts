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
      (optAccountHolder (get accountHolder paramsTuple))
      (optAmount (get amount paramsTuple))
      (optPeriod (get period paramsTuple))
    )
    (try! (is-dao-or-extension))
    ;; have to provide at least one
    (asserts! (or (is-some optAccountHolder) (is-some optAmount) (is-some optPeriod)) ERR_INVALID_PARAMS)
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set account holder if present
    (and (is-some optAccountHolder)
      (try! (contract-call? .aibtc-timed-vault set-account-holder (unwrap-panic optAccountHolder)))
    )
    ;; set amounts if present and within limits
    (and (is-some optAmount) (> (unwrap-panic optAmount) u0) (< (unwrap-panic optAmount) u100000000)
      (try! (contract-call? .aibtc-timed-vault set-withdrawal-amount (unwrap-panic optAmount)))
    )
    ;; set period if present and within limits
    (and (is-some optPeriod) (> (unwrap-panic optPeriod) u6) (< (unwrap-panic optPeriod) u8064)
      (try! (contract-call? .aibtc-timed-vault set-withdrawal-period (unwrap-panic optPeriod)))
    )
    (ok true)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
