;; @title Bonding Curve Token by STX.CITY
;; @version 2.0
;; @hash <%= it.hash %> 
;; @targetstx <%= it.target_stx %> 

;; Traits
(impl-trait .aibtcdev-dao-traits-v1.token) ;; <%= it.token_trait %>
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; Errors 
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402)
(define-constant ERR-INVALID-PARAMETERS u403)
(define-constant ERR-NOT-ENOUGH-FUND u101)

;; Constants
(define-constant MAXSUPPLY u1000000000000000) ;; <%= it.token_max_supply %>

;; Variables
(define-fungible-token SYMBOL MAXSUPPLY) ;; <%= it.token_symbol %>
(define-data-var contract-owner principal .aibtc-token-owner) ;; <%= it.token_owner %>

;; SIP-10 Functions
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
        (ft-transfer? SYMBOL amount from to) ;; <%= it.token_symbol %>
    )
)

;; Define token metadata
(define-data-var token-uri (optional (string-utf8 256)) (some u"<%= it.token_uri %>"))

;; Set token uri
(define-public (set-token-uri (value (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))
        (var-set token-uri (some value))
        (ok (print {
              notification: "token-metadata-update",
              payload: {
                contract-id: (as-contract tx-sender),
                token-class: "ft"
              }
            })
        )
    )
)

;; Read-Only Functions
(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance SYMBOL owner)) ;; <%= it.token_symbol %>
)
(define-read-only (get-name)
  (ok "NAME") ;; <%= it.token_name %>
)
(define-read-only (get-symbol)
  (ok "SYMBOL") ;; <%= it.token_symbol %>
)
(define-read-only (get-decimals)
  (ok u6) ;; <%= it.token_decimals %>
)
(define-read-only (get-total-supply)
  (ok (ft-get-supply SYMBOL)) ;; <%= it.token_symbol %>
)
(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; transfer ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; Checks if the sender is the current owner
    (if (is-eq tx-sender (var-get contract-owner))
      (begin
        ;; Sets the new owner
        (var-set contract-owner new-owner)
        ;; Returns success message
        (ok "Ownership transferred successfully"))
      ;; Error if the sender is not the owner
      (err ERR-NOT-OWNER)))
)

(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))
  (fold check-err (map send-token recipients) (ok true))
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result err-value (err err-value))
)

(define-private (send-token (recipient { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount recipient) (get to recipient) (get memo recipient))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (let ((transferOk (try! (transfer amount tx-sender to memo))))
    (ok transferOk)
  )
)

(define-private (send-stx (recipient principal) (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender recipient))
    (ok true)
  )
)

(begin
  ;; Send STX fees
  (try! (send-stx 'ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1 u500000)) ;; <%= it.stxcity_token_deployment_fee_address %>
  ;; mint tokens to the dex_contract (20%)
  (try! (ft-mint? SYMBOL (/ (* MAXSUPPLY u20) u100) .aibtc-token-dex)) ;; <%= it.token_symbol %> <%= it.dex_contract %>
  ;; mint tokens to the treasury (80%)
  (try! (ft-mint? SYMBOL (/ (* MAXSUPPLY u80) u100) .aibtc-treasury)) ;; <%= it.token_symbol %> <%= it.treasury_contract %>
)
;; Total supply - tokens in treasury - tokens in dex
(define-read-only (get-liquid-supply)
  (- (ft-get-supply SYMBOL) (ft-get-balance SYMBOL .aibtc-treasury) (ft-get-balance SYMBOL .aibtc-token-dex))
)