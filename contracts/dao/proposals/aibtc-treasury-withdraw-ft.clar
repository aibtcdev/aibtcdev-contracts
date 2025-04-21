(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew fungible tokens in the treasury extension")
(define-constant CFG_TOKEN_AMOUNT u1000) ;; in microFT

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; withdraw fungible tokens from the treasury
    (contract-call? .aibtc-treasury withdraw-ft .aibtc-token CFG_TOKEN_AMOUNT)
  )
)
