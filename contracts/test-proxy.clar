
;; title: test-proxy

;; constants
;;
(define-constant CONTRACT (as-contract tx-sender))
(define-constant OWNER tx-sender)

;; public functions
;;
(define-public (get-standard-caller)
  (begin
    (print {
      caller: contract-caller,
      sender: tx-sender,
    })
    (ok (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-bank-account get-standard-caller))
  )
)

(define-public (mint-aibtcdev-1 (to principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-1 mint to)
)

(define-public (mint-aibtcdev-2 (to principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-2 mint to)
)
