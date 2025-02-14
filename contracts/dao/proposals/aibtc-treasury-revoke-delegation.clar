(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Revoke STX delegation")
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; revoke STX delegation
    (contract-call? CFG_TREASURY_CONTRACT revoke-delegate-stx)
  )
)
