(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced extension in DAO")
(define-constant CFG_BASE_DAO .aibtc-base-dao)
(define-constant CFG_OLD_EXTENSION .aibtc-bank-account)
(define-constant CFG_NEW_EXTENSION .aibtc-bank-account)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces an extension in the DAO
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; check that old extension exists
    (asserts! (contract-call? CFG_BASE_DAO is-extension CFG_OLD_EXTENSION) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status to false
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_OLD_EXTENSION false))
    ;; add new extension to the dao
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_NEW_EXTENSION true))
    (ok true)
  )
)
