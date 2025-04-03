(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant CFG_DAO_MANIFEST_TEXT "<%= it.dao_manifest %>")
(define-constant CFG_DAO_MANIFEST_INSCRIPTION_ID "<%= it.dao_manifest_inscription_id %>")

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        {extension: .aibtc-action-proposals-v2, enabled: true}
        {extension: .aibtc-core-proposals-v2, enabled: true}
        {extension: .aibtc-dao-charter, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-payments-invoices, enabled: true}
        {extension: .aibtc-timed-vault-dao, enabled: true}
        {extension: .aibtc-timed-vault-sbtc, enabled: true}
        {extension: .aibtc-timed-vault-stx, enabled: true}
        {extension: .aibtc-token-owner, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        {extension: .aibtc-action-add-resource, enabled: true}
        {extension: .aibtc-action-configure-timed-vault-dao, enabled: true}
        {extension: .aibtc-action-configure-timed-vault-sbtc, enabled: true}
        {extension: .aibtc-action-configure-timed-vault-stx, enabled: true}
        {extension: .aibtc-action-send-message, enabled: true}
        {extension: .aibtc-action-toggle-resource-by-name, enabled: true}
        {extension: .aibtc-action-treasury-allow-asset, enabled: true}
      )
    ))
    ;; set DAO manifest in dao-charter extension
    (try! (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_MANIFEST_TEXT none))
    ;; send DAO manifest as onchain message
    (try! (contract-call? .aibtc-onchain-messaging send CFG_DAO_MANIFEST_TEXT true))
    ;; allow assets in treasury
    (try! (contract-call? .aibtc-treasury allow-assets
      (list
        {token: .aibtc-token, enabled: true}
        {token: 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token, enabled: true}
      )
    ))
    ;; print manifest
    (print CFG_DAO_MANIFEST_TEXT)
    (ok true)
  )
)

