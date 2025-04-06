(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal amount in the BTC timed vault extension")
(define-constant CFG_WITHDRAWAL_AMOUNT u100000) ;; 0.001 BTC (8 decimals)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the withdrawal amount
    (contract-call? .aibtc-timed-vault-sbtc set-withdrawal-amount CFG_WITHDRAWAL_AMOUNT)
  )
)
