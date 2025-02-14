(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw an NFT from the treasury")
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)
(define-constant CFG_NFT_CONTRACT .aibtcdev-airdrop-1)
(define-constant CFG_NFT_ID u1)
(define-constant CFG_RECIPIENT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; withdraw an NFT from the treasury
    (contract-call? CFG_TREASURY_CONTRACT withdraw-nft CFG_NFT_CONTRACT CFG_NFT_ID CFG_RECIPIENT)
  )
)
