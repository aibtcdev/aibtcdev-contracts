(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal amount in the DAO token timed vault extension")
(define-constant CFG_WITHDRAWAL_AMOUNT u1000000000) ;; 10 DAO tokens (8 decimals)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? .aibtc-timed-vault-dao set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
