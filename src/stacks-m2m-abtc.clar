;; title: stacks-m2m-aibtc
;; version: 0.0.1
;; summary: Copy of ALEX aBTC contract for use on testnet only.

;; tokens
;; 
(define-fungible-token bridged-btc)

;; constants
;;
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ONE_8 u100000000)

;; used for faucet add-on
(define-constant FAUCET-DRIP u10000) ;; 0.0001 BTC
(define-constant FAUCET-DROP u1000000) ;; 0.01 BTC
(define-constant FAUCET-FLOOD u100000000) ;; 1 BTC

;; data vars
;;
(define-data-var contract-owner principal tx-sender)
(define-data-var token-name (string-ascii 32) "aiBTC")
(define-data-var token-symbol (string-ascii 10) "aiBTC")
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://cdn.alexlab.co/metadata/token-abtc.json"))
(define-data-var token-decimals uint u8)

;; data maps
;;
(define-map approved-contracts principal bool)

;; read only functions
;;

(define-read-only (get-contract-owner)
	(ok (var-get contract-owner)))

(define-read-only (get-name)
	(ok (var-get token-name)))

(define-read-only (get-symbol)
	(ok (var-get token-symbol)))

(define-read-only (get-decimals)
	(ok (var-get token-decimals)))

(define-read-only (get-balance (who principal))
	(ok (ft-get-balance bridged-btc who)))

(define-read-only (get-total-supply)
	(ok (ft-get-supply bridged-btc)))

(define-read-only (get-token-uri)
	(ok (var-get token-uri)))

(define-read-only (fixed-to-decimals (amount uint))
	(/ (* amount (pow-decimals)) ONE_8))
	
(define-private (decimals-to-fixed (amount uint))
	(/ (* amount ONE_8) (pow-decimals)))
	
(define-read-only (get-total-supply-fixed)
	(ok (decimals-to-fixed (unwrap-panic (get-total-supply)))))

(define-read-only (get-balance-fixed (account principal))
	(ok (decimals-to-fixed (unwrap-panic (get-balance account)))))

;; public functions
;;
(define-public (set-contract-owner (owner principal))
	(begin
		(try! (check-is-owner))
		(ok (var-set contract-owner owner))))

(define-public (set-name (new-name (string-ascii 32)))
	(begin
		(try! (check-is-owner))
		(ok (var-set token-name new-name))))

(define-public (set-symbol (new-symbol (string-ascii 10)))
	(begin
		(try! (check-is-owner))
		(ok (var-set token-symbol new-symbol))))

(define-public (set-decimals (new-decimals uint))
	(begin
		(try! (check-is-owner))
		(ok (var-set token-decimals new-decimals))))

(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
	(begin
		(try! (check-is-owner))
		(ok (var-set token-uri new-uri))))

(define-public (add-approved-contract (new-approved-contract principal))
	(begin
		(try! (check-is-owner))
		(ok (map-set approved-contracts new-approved-contract true))))

(define-public (set-approved-contract (owner principal) (approved bool))
	(begin
		(try! (check-is-owner))
		(ok (map-set approved-contracts owner approved))))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(asserts! (is-eq sender tx-sender) ERR-NOT-AUTHORIZED)
		(try! (ft-transfer? bridged-btc amount sender recipient))
		(match memo to-print (print to-print) 0x)
		(ok true)))

(define-public (mint (amount uint) (recipient principal))
	(begin
		(asserts! (or (is-ok (check-is-approved)) (is-ok (check-is-owner))) ERR-NOT-AUTHORIZED)
		(ft-mint? bridged-btc amount recipient)))

(define-public (burn (amount uint) (sender principal))
	(begin
		(asserts! (or (is-ok (check-is-approved)) (is-ok (check-is-owner))) ERR-NOT-AUTHORIZED)
		(ft-burn? bridged-btc amount sender)))

(define-public (transfer-fixed (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(transfer (fixed-to-decimals amount) sender recipient memo))

(define-public (mint-fixed (amount uint) (recipient principal))
	(mint (fixed-to-decimals amount) recipient))

(define-public (burn-fixed (amount uint) (sender principal))
	(burn (fixed-to-decimals amount) sender))

(define-public (burn-fixed-many (senders (list 200 {amount: uint, sender: principal})))
	(begin
		(asserts! (or (is-ok (check-is-approved)) (is-ok (check-is-owner))) ERR-NOT-AUTHORIZED)
		(ok (map burn-fixed-many-iter senders))))

;; adding in some faucet functions for testnet testing
(define-public (faucet-drip (recipient principal))
	(ft-mint? bridged-btc FAUCET-DRIP recipient))

(define-public (faucet-drop (recipient principal))
	(ft-mint? bridged-btc FAUCET-DROP recipient))

(define-public (faucet-flood (recipient principal))
	(ft-mint? bridged-btc FAUCET-FLOOD recipient))


;; private functions
;;
(define-private (check-is-owner)
	(ok (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)))

(define-private (check-is-approved)
	(ok (asserts! (default-to false (map-get? approved-contracts tx-sender)) ERR-NOT-AUTHORIZED)))

(define-private (pow-decimals)
	(pow u10 (unwrap-panic (get-decimals))))

(define-private (burn-fixed-many-iter (item {amount: uint, sender: principal}))
	(burn-fixed (get amount item) (get sender item)))
