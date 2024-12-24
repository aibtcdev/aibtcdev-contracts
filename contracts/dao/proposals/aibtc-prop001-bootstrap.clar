(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant DAO_MANIFEST "This is where the DAO can put it's mission, purpose, and goals.")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-ext001-actions, enabled: true}
        {extension: .aibtc-ext002-bank-account, enabled: true}
        {extension: .aibtc-ext003-direct-execute, enabled: true}
        {extension: .aibtc-ext004-messaging, enabled: true}
        {extension: .aibtc-ext005-payments, enabled: true}
        {extension: .aibtc-ext006-treasury, enabled: true}
      )
    ))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
