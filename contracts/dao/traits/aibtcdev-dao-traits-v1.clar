;; title: aibtcdev-dao-traits-v1
;; version: 1.0.0
;; summary: A collection of traits for the aibtcdev DAO

;; IMPORTS

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; CORE DAO TRAITS

(define-trait proposal (
  (execute (principal) (response bool uint))
))

(define-trait extension (
  (callback (principal (buff 34)) (response bool uint))
))

;; EXTENSION TRAITS

(define-trait bank-account (
  ;; set account holder
  ;; @param principal the new account holder
  ;; @returns (response bool uint)
  (set-account-holder (principal) (response bool uint))
  ;; set withdrawal period
  ;; @param period the new withdrawal period in blocks
  ;; @returns (response bool uint)
  (set-withdrawal-period (uint) (response bool uint))
  ;; set withdrawal amount
  ;; @param amount the new withdrawal amount in microSTX
  ;; @returns (response bool uint)
  (set-withdrawal-amount (uint) (response bool uint))
  ;; override last withdrawal block
  ;; @param block the new last withdrawal block
  ;; @returns (response bool uint)
  (override-last-withdrawal-block (uint) (response bool uint))
  ;; deposit STX to the bank account
  ;; @param amount amount of microSTX to deposit
  ;; @returns (response bool uint)
  (deposit-stx (uint) (response bool uint))
  ;; withdraw STX from the bank account
  ;; @returns (response bool uint) 
  (withdraw-stx () (response bool uint))
))

(define-trait messaging
  (
    ;; send a message on-chain (opt from DAO)
    ;; @param msg the message to send (up to 1MB)
    ;; @param isFromDao whether the message is from the DAO
    ;; @returns (response bool uint)
    (send ((string-ascii 1048576) bool) (response bool uint))
  )
)

(define-trait resources
  (
    ;; set payment address for resource invoices
    ;; @param principal the new payment address
    ;; @returns (response bool uint)
    (set-payment-address (principal) (response bool uint))
    ;; adds a new resource that users can pay for
    ;; @param name the name of the resource (unique!)
    ;; @param price the price of the resource in microSTX
    ;; @param description a description of the resource
    ;; @returns (response uint uint)
    (add-resource ((string-utf8 50) (string-utf8 255) uint (optional (string-utf8 255))) (response uint uint))
    ;; toggles a resource on or off for payment
    ;; @param resource the ID of the resource
    ;; @returns (response bool uint)
    (toggle-resource (uint) (response bool uint))
    ;; toggles a resource on or off for payment by name
    ;; @param name the name of the resource
    ;; @returns (response bool uint)
    (toggle-resource-by-name ((string-utf8 50)) (response bool uint))
  )
)

(define-trait invoices
  (
    (pay-invoice (uint (optional (buff 34))) (response uint uint))
    (pay-invoice-by-resource-name ((string-utf8 50) (optional (buff 34))) (response uint uint))
  )
)

(define-trait treasury
 (
   ;; STX deposits and withdrawals
   (deposit-stx (uint) (response bool uint))
   (withdraw-stx (uint principal) (response bool uint))

   ;; Fungible token deposits and withdrawals
   (deposit-ft (<ft-trait> uint) (response bool uint))
   (withdraw-ft (<ft-trait> uint principal) (response bool uint))

   ;; NFT deposits and withdrawals 
   (deposit-nft (<nft-trait> uint) (response bool uint))
   (withdraw-nft (<nft-trait> uint principal) (response bool uint))
 )
)