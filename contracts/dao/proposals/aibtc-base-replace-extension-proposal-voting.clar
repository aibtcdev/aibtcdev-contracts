(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; check that old extensions exist
    (asserts! (contract-call? .aibtcdev-base-dao is-extension .aibtc-action-proposals) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? .aibtcdev-base-dao is-extension .aibtc-core-proposals) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-action-proposals false))
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-core-proposals false))
    ;; add new extensions
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-action-proposals-v2 true))
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-core-proposals-v2 true))
    (ok true)
  )
)
