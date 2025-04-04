(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew DAO tokens from the timed vault extension")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; withdraw DAO tokens from the timed vault
    (contract-call? .aibtc-timed-vault-dao withdraw)
  )
)
