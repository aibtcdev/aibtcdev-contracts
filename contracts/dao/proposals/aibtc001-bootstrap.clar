(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant DAO_MANIFEST "This is where the DAO can put it's mission, purpose, and goals.")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? .aibtcdev-dao set-extensions
      (list
        {extension: .aibtcdev-bank-account, enabled: true}
        {extension: .aibtcdev-messaging, enabled: true}
        {extension: .aibtcdev-payments, enabled: true}
        {extension: .aibtcdev-treasury, enabled: true}
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
