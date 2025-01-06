(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; sets the token uri for the dao token
  (contract-call? .aibtc-token-owner set-token-uri "https://example.com/token.json")
)
