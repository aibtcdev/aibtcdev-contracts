(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; disables an extension in the DAO
  (begin
    ;; check that extension exists, avoids write if not
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-bank-account) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-bank-account false))
    (ok true)
  )
)
