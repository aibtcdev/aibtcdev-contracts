(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initialized a new BTC timed vault in the base dao and funded it from the treasury")
(define-constant CFG_ACCOUNT_HOLDER 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant CFG_AMOUNT_TO_FUND_SBTC u100) ;; set to 0 to skip, in microsBTC

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set the account holder in the timed vault
    (try! (contract-call? .aibtc-timed-vault-sbtc set-account-holder CFG_ACCOUNT_HOLDER))
    ;; enable the extension in the dao
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-timed-vault-sbtc true))
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_SBTC u0)
      (try! (contract-call? .aibtc-treasury withdraw-ft 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token CFG_AMOUNT_TO_FUND_SBTC .aibtc-timed-vault-sbtc)))
    (ok true)
  )
)
