;; <%= it.hash %>
;; <%= it.token_symbol %> Powered By Faktory.fun v1.0 

(impl-trait .faktory-trait-v1.sip-010-trait) ;; 'SP3XXMS38VTAWTVPE5682XSBFXPTH7XCPEBTX8AN2
(impl-trait .aibtcdev-dao-traits-v1.token) ;; 'SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC

(define-constant ERR-NOT-AUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402)

(define-fungible-token SYMBOL MAX) ;; <%= it.token_symbol %>
(define-constant MAX u69000000000000) ;; <%= it.token_max_supply %>
(define-data-var contract-owner principal .aibtc-token-owner) ;; <%= it.token_owner %>
(define-data-var token-uri (optional (string-utf8 256)) (some u"<%= it.token_uri %>")) 

;; SIP-10 Functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
       (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
       (ft-transfer? SYMBOL amount sender recipient) ;; <%= it.token_symbol %>
    )
)

(define-public (set-token-uri (value (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
        (var-set token-uri (some value))
        ;; TODO: SIP-019 format
        (print {
              notification: "uri-update",
              contract-id: (as-contract tx-sender),
              token-uri: value})
        (ok true)
    )
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance SYMBOL account)) ;; <%= it.token_symbol %>
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

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (print {new-owner: new-owner})
    (ok (var-set contract-owner new-owner))
  )
)

;; ---------------------------------------------------------

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

;; ---------------------------------------------------------

(define-private (stx-transfer-to (recipient principal) (amount uint))
  (stx-transfer? amount tx-sender recipient)
)

(begin 
    ;; ft distribution
    (try! (ft-mint? SYMBOL (/ (* MAX u80) u100) .aibtc-treasury)) ;; 80% treasury SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22
    (try! (ft-mint? SYMBOL (/ (* MAX u20) u100) .aibtc-dex-faktory)) ;; 20% dex SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22

    ;; deploy fixed fee
   ;; (try! (stx-transfer-to 'SMH8FRN30ERW1SX26NJTJCKTDR3H27NRJ6W75WQE u500000)) 

    (print { 
        type: "faktory-trait-v1", 
        name: "NAME", ;; <%= it.token_name %>
        symbol: "SYMBOL", ;; <%= it.token_symbol %>
        token-uri: u"<%= it.token_uri %>", 
        tokenContract: (as-contract tx-sender),
        supply: MAX, 
        decimals: u6, ;; <%= it.token_decimals %>
        targetStx: u2000000000, ;; <%= it.target_stx %> 
        tokenToDex: (/ (* MAX u20) u100),
        tokenToDeployer: u0,
        stxToDex: u0,
        stxBuyFirstFee: u0,
    })
)