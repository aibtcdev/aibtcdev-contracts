(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant DAO_MANIFEST "This is where the DAO can put it's mission, purpose, and goals.")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-action-proposals, enabled: true}
        {extension: .aibtc-bank-account, enabled: true}
        {extension: .aibtc-core-proposals, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-payments-invoices, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
        {extension: .set-account-holder, enabled: true}
        {extension: .send-message, enabled: true}
      )
    ))

    (try! (contract-call? .aibtc-action-proposals set-protocol-treasury .aibtc-treasury))
    (try! (contract-call? .aibtc-action-proposals set-voting-token .aibtc-token))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
