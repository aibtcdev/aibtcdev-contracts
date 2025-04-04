(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initialized a new DAO token timed vault in the base dao and funded it from the treasury")
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant CFG_AMOUNT_TO_FUND_DAO u100) ;; set to 0 to skip, in microDAO tokens

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the account holder in the timed vault
    (try! (contract-call? .aibtc-timed-vault-dao set-account-holder CFG_ACCOUNT_HOLDER))
    ;; enable the extension in the dao
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-timed-vault-dao true))
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_DAO u0)
      (try! (contract-call? .aibtc-treasury withdraw-ft .aibtc-token CFG_AMOUNT_TO_FUND_DAO .aibtc-timed-vault-dao)))
    (ok true)
  )
)
