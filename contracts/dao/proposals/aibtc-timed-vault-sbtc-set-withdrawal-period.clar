(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set withdrawal period in the BTC timed vault extension")
(define-constant CFG_WITHDRAWAL_PERIOD u144)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the withdrawal period
    (contract-call? .aibtc-timed-vault-sbtc set-withdrawal-period CFG_WITHDRAWAL_PERIOD)
  )
)
