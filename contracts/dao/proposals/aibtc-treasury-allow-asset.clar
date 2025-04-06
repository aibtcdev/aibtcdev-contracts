(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Allowed or enabled asset for use in the treasury extension")
(define-constant CFG_ASSET 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.abtc)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; allow an asset for deposit and withdrawal in the treasury
    (contract-call? .aibtc-treasury allow-asset CFG_ASSET true)
  )
)
