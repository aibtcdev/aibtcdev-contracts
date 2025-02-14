(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Disabled extension in DAO")
(define-constant CFG_BASE_DAO .aibtc-base-dao)
(define-constant CFG_EXTENSION .aibtc-bank-account)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; check that extension exists, avoids write if not
    (asserts! (contract-call? CFG_BASE_DAO is-extension CFG_EXTENSION) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_EXTENSION false))
    (ok true)
  )
)
