(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant CFG_DAO_CHARTER_TEXT "<%= it.dao_charter_text %>")
(define-constant CFG_DAO_CHARTER_INSCRIPTION_ID 0x) ;; <%= it.dao_charter_inscription_id %>

(define-public (execute (sender principal))
  ;; updates the charter for a dao
  (if (> (len CFG_DAO_CHARTER_INSCRIPTION_ID) u0)
    (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_CHARTER_TEXT (some CFG_DAO_CHARTER_INSCRIPTION_ID))
    (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_CHARTER_TEXT none)
  )
)