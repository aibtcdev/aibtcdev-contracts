(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Override last withdrawal block")
(define-constant CFG_LAST_WITHDRAWAL_BLOCK burn-block-height)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; override last withdrawal block in the timed vault
    (contract-call? .aibtc-timed-vault override-last-withdrawal-block CFG_LAST_WITHDRAWAL_BLOCK) ;; CFG_TIMED_VAULT_CONTRACT
  )
)
