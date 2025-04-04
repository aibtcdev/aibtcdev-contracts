(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal amount in the STX timed vault extension")
(define-constant CFG_WITHDRAWAL_AMOUNT u10000000) ;; 10 STX (6 decimals)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? .aibtc-timed-vault-stx set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
