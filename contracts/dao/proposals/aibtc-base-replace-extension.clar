(impl-trait .aibtc-dao-traits-v3.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Replaced extension in the base DAO")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_BASE_DAO .aibtc-base-dao
;; was CFG_OLD_EXTENSION .aibtc-timed-vault-stx
;; was CFG_NEW_EXTENSION .aibtc-timed-vault-stx

;; errors
(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces an extension in the DAO
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; check that old extension exists
    (asserts! (contract-call? .aibtc-base-dao is-extension .aibtc-timed-vault-stx) ERR_EXTENSION_NOT_FOUND)
    ;; update extension status to false
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-timed-vault-stx false))
    ;; add new extension to the dao
    (try! (contract-call? .aibtc-base-dao set-extension .aibtc-timed-vault-stx true))
    (ok true)
  )
)
