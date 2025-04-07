(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew BTC from the timed vault extension")

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; withdraw sBTC from the timed vault
    (contract-call? .aibtc-timed-vault-sbtc withdraw)
  )
)
