(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Sent an on-chain message verifed from the DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)
)
