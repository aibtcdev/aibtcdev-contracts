(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.action)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))
(define-constant ERR_PARAMS_OUT_OF_RANGE (err u10003))

(define-constant CFG_MESSAGE "Executed Action Proposal: Set withdrawal period in timed vault extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (period (unwrap! (from-consensus-buff? uint parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    ;; verify within limits for low quorum
    ;; more than 6 blocks (1hr), less than 1008 blocks (~1 week)
    (asserts! (and (> period u6) (< period u1008)) ERR_PARAMS_OUT_OF_RANGE)
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (contract-call? .aibtc-timed-vault set-withdrawal-period period)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
