(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.action)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))
(define-constant ERR_PARAMS_OUT_OF_RANGE (err u10003))

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (amount (unwrap! (from-consensus-buff? uint parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    ;; verify within limits for low quorum
    ;; more than 0, less than 100 STX (100_000_000)
    (asserts! (and (> amount u0) (< amount u100000000)) ERR_INVALID_PARAMS)
    (contract-call? .aibtc-timed-vault set-withdrawal-amount amount)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
