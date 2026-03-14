
;; title: test-proxy

;; constants
;;
(define-constant CONTRACT (as-contract tx-sender))
(define-constant OWNER tx-sender)

;; public functions
;;
(define-public (mint-aibtcdev-1 (to principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-1 mint to)
)

(define-public (mint-aibtcdev-2 (to principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-2 mint to)
)

(define-public (burn-aibtcdev-1 (id uint) (from principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-1 burn id from)
)

(define-public (burn-aibtcdev-2 (id uint) (from principal))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-2 burn id from)
)

(define-public (set-url-aibtcdev-1 (newUrl (string-ascii 256)))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-1 set-url newUrl)
)

(define-public (set-url-aibtcdev-2 (newUrl (string-ascii 256)))
  (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-airdrop-2 set-url newUrl)
)
