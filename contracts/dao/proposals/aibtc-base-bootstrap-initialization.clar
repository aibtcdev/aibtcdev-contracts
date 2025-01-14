(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant DAO_MANIFEST "This is where the DAO can put it's mission, purpose, and goals.")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions list
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-action-proposals, enabled: true}
        {extension: .aibtc-bank-account, enabled: true}
        {extension: .aibtc-core-proposals, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-payments-invoices, enabled: true}
        {extension: .aibtc-token-owner, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
      )
    ))
    ;; initialize action proposals
    (try! (contract-call? .aibtc-action-proposals set-protocol-treasury .aibtc-treasury))
    ;; initialize core proposals
    (try! (contract-call? .aibtc-core-proposals set-protocol-treasury .aibtc-treasury))
    ;; send DAO manifest as onchain message
    (try! (contract-call? .aibtc-onchain-messaging send DAO_MANIFEST true))
    ;; allow assets in treasury
    (try! (contract-call? .aibtc-treasury allow-asset .aibtc-token true))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
