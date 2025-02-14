(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging)
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced proposal voting extensions")
(define-constant CFG_BASE_DAO .aibtc-base-dao)
(define-constant CFG_OLD_ACTION_PROPOSALS .aibtc-action-proposals)
(define-constant CFG_OLD_CORE_PROPOSALS .aibtc-core-proposals)
(define-constant CFG_NEW_ACTION_PROPOSALS .aibtc-action-proposals-v2)
(define-constant CFG_NEW_CORE_PROPOSALS .aibtc-core-proposals-v2)

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; send a message from the dao
    (try! (contract-call? CFG_MESSAGE_CONTRACT send CFG_MESSAGE true))
    ;; check that old extensions exist
    (asserts! (contract-call? CFG_BASE_DAO is-extension CFG_OLD_ACTION_PROPOSALS) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? CFG_BASE_DAO is-extension CFG_OLD_CORE_PROPOSALS) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_OLD_ACTION_PROPOSALS false))
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_OLD_CORE_PROPOSALS false))
    ;; add new extensions
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_NEW_ACTION_PROPOSALS true))
    (try! (contract-call? CFG_BASE_DAO set-extension CFG_NEW_CORE_PROPOSALS true))
    (ok true)
  )
)
