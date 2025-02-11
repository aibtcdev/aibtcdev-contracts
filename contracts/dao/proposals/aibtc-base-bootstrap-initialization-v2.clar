(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant CFG_DAO_MANIFEST "<%= it.dao_manifest %>")
(define-constant DAO_ACTIVATED (contract-call? .aibtc-dao-charter is-dao-activated))

(define-public (execute (sender principal))
  (begin
    ;; initialize dao charter as first extension
    (try! (contract-call? .aibtcdev-base-dao set-extension .aibtc-dao-charter true))
    ;; TODO: keep here or in dao charter?
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-action-proposals-v2, enabled: DAO_ACTIVATED}
        {extension: .aibtc-bank-account, enabled: DAO_ACTIVATED}
        {extension: .aibtc-core-proposals-v2, enabled: DAO_ACTIVATED}
        {extension: .aibtc-onchain-messaging, enabled: DAO_ACTIVATED}
        {extension: .aibtc-payments-invoices, enabled: DAO_ACTIVATED}
        {extension: .aibtc-token-owner, enabled: DAO_ACTIVATED}
        {extension: .aibtc-treasury, enabled: DAO_ACTIVATED}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-action-add-resource, enabled: true}
        {extension: .aibtc-action-allow-asset, enabled: true}
        {extension: .aibtc-action-send-message, enabled: true}
        {extension: .aibtc-action-set-account-holder, enabled: true}
        {extension: .aibtc-action-set-withdrawal-amount, enabled: true}
        {extension: .aibtc-action-set-withdrawal-period, enabled: true}
        {extension: .aibtc-action-toggle-resource-by-name, enabled: true}
      )
    ))
    ;; send DAO manifest as onchain message
    (try! (contract-call? .aibtc-onchain-messaging send CFG_DAO_MANIFEST true))
    ;; allow assets in treasury
    (try! (contract-call? .aibtc-treasury allow-asset .aibtc-token true))
    ;; print manifest
    (print CFG_DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  CFG_DAO_MANIFEST
)
