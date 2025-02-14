(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit STX to the treasury")
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)
(define-constant CFG_STX_AMOUNT u1000000) ;; in microSTX

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; deposit STX to the treasury
    (contract-call? CFG_TREASURY_CONTRACT deposit-stx CFG_STX_AMOUNT)
  )
)
