(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_BASE_DAO .aibtc-base-dao)
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Initializing new bank account")
(define-constant CFG_ACCOUNT_HOLDER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant CFG_NEW_BANK_ACCOUNT_EXTENSION .aibtc-bank-account)
(define-constant CFG_TREASURY_CONTRACT .aibtc-treasury)
(define-constant CFG_AMOUNT_TO_FUND_STX u100) ;; set to 0 to skip, in microSTX
(define-constant CFG_TOKEN_CONTRACT .aibtc-token)
(define-constant CFG_AMOUNT_TO_FUND_FT u100) ;; set to 0 to skip, in microFT

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; set the account holder in the bank account
    (try! (contract-call? CFG_NEW_BANK_ACCOUNT_EXTENSION set-account-holder CFG_ACCOUNT_HOLDER))
    ;; enable the extension in the dao
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_NEW_BANK_ACCOUNT_EXTENSION true))
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_STX u0)
      (try! (contract-call? CFG_TREASURY_CONTRACT withdraw-stx CFG_AMOUNT_TO_FUND_STX CFG_NEW_BANK_ACCOUNT_EXTENSION)))
    (and (> CFG_AMOUNT_TO_FUND_FT u0)
      (try! (contract-call? CFG_TREASURY_CONTRACT withdraw-ft CFG_TOKEN_CONTRACT CFG_AMOUNT_TO_FUND_FT CFG_NEW_BANK_ACCOUNT_EXTENSION)))
    (ok true)
  )
)
