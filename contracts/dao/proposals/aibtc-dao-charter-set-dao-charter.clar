(impl-trait .aibtc-dao-traits-v2.proposal)

(define-constant CFG_CHARTER_CONTRACT .aibtc-dao-charter)
(define-constant CFG_CHARTER_TEXT "<%= it.dao_charter_text %>")
(define-constant CFG_CHARTER_INSCRIPTION_ID 0x) ;; <%= it.dao_charter_inscription_id %>

(define-public (execute (sender principal))
  ;; updates the charter for a dao
  (if (> (len CFG_CHARTER_INSCRIPTION_ID) u0)
    (contract-call? CFG_CHARTER_CONTRACT set-dao-charter CFG_CHARTER_TEXT (some CFG_CHARTER_INSCRIPTION_ID))
    (contract-call? CFG_CHARTER_CONTRACT set-dao-charter CFG_CHARTER_TEXT none)
  )
)