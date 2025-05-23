(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension in the base DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_NEW_EXTENSION .aibtc-timed-vault-stx

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? .aibtc-base-dao set-extension .aibtc-timed-vault-stx true)
  )
)
