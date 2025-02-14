(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw fungible tokens from the treasury")
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)
(define-constant CFG_TOKEN_CONTRACT .aibtc-token)
(define-constant CFG_TOKEN_AMOUNT u1000) ;; in microFT
(define-constant CFG_RECIPIENT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; withdraw fungible tokens from the treasury
    (contract-call? CFG_TREASURY_CONTRACT withdraw-ft CFG_TOKEN_CONTRACT CFG_TOKEN_AMOUNT CFG_RECIPIENT)
  )
)
