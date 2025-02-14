(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Added new extension to DAO")
(define-constant CFG_BASE_DAO .aibtc-base-dao)
(define-constant CFG_NEW_EXTENSION .aibtc-bank-account)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; adds and enables a new extension to the DAO
    (contract-call? CFG_BASE_DAO set-extension CFG_NEW_EXTENSION true)
  )
)
