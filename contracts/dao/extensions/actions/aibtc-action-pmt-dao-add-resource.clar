(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.action)

(define-constant ERR_UNAUTHORIZED (err u10001))
(define-constant ERR_INVALID_PARAMS (err u10002))

(define-constant CFG_MESSAGE "Executed Action Proposal: Added a resource in the DAO payment processor extension")

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    (
      (paramsTuple (unwrap! (from-consensus-buff?
        { name: (string-utf8 50), description: (string-utf8 255), price: uint, url: (optional (string-utf8 255)) }
        parameters) ERR_INVALID_PARAMS))
    )
    (try! (is-dao-or-extension))
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    (try! (contract-call? .aibtc-payment-processor-dao add-resource (get name paramsTuple) (get description paramsTuple) (get price paramsTuple) (get url paramsTuple)))
    (ok true)
  )
)

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)
