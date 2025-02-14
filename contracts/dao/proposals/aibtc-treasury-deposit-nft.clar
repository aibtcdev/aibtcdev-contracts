(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit NFT to the treasury")
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)
(define-constant CFG_NFT_CONTRACT .aibtcdev-airdrop-1)
(define-constant CFG_NFT_ID u1)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; deposit NFT to the treasury
    ;; TODO: unable to use template vars, causes errors
    (contract-call? .aibtc-treasury deposit-nft .aibtcdev-airdrop-1 CFG_NFT_ID)
  )
)
