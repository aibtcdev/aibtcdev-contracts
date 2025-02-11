(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces an extension in the DAO
  (begin
    ;; check that old extension exists
    (asserts! (contract-call? .aibtcdev-base-dao is-extension .aibtc-bank-account) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status to false
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-bank-account false))
    ;; add new extension to the dao
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-bank-account true))
    (ok true)
  )
)
