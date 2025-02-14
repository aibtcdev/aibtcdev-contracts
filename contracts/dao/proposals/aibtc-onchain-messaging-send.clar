(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Send a message from the DAO")

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true)
)
