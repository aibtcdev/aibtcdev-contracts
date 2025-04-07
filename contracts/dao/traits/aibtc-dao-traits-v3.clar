;; title: aibtc-dao-traits
;; version: 3.0.0
;; summary: A collection of traits for all aibtc daos.

;; IMPORTS
(use-trait faktory-token .faktory-trait-v1.sip-010-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; CORE DAO TRAITS

;; a one-time action proposed by token holders
(define-trait proposal (
  (execute (principal) (response bool uint))
))

;; a standing feature of the dao implemented in Clarity
(define-trait extension (
  (callback (principal (buff 34)) (response bool uint))
))

;; TOKEN TRAITS

;; the decentralized Bitflow trading pool following their xyk formula
(define-trait bitflow-pool (
  ;; transfer funds (we're just tagging this contract)
  ;; all functions are covered between sip-010 and bitflow-xyk
  (transfer (uint principal principal (optional (buff 34))) (response bool uint))
))

;; the decentralized exchange and initial bonding curve for a token
;; can be used to buy and sell tokens until the target is reached
;; liquidity is provided by the initial minting of tokens (20%)
;; reaching the target will trigger migration to the Bitflow pool
(define-trait faktory-dex (
  ;; buy tokens from the dex
  ;; @param ft the token contract
  ;; @param ustx the amount of microSTX to spend
  ;; @returns (response bool uint)
  (buy (<faktory-token> uint) (response bool uint))
  ;; sell tokens to the dex
  ;; @param ft the token contract
  ;; @param amount the amount of tokens to sell
  ;; @returns (response bool uint)
  (sell (<faktory-token> uint) (response bool uint))
))

;; the token contract for the dao, with no pre-mine or initial allocation
(define-trait token (
  ;; transfer funds (limited as we're just tagging this)
  (transfer (uint principal principal (optional (buff 34))) (response bool uint))
))

;; EXTENSION TRAITS

;; a pre-defined action that token holders can propose
(define-trait action (
  ;; @param parameters serialized hex-encoded Clarity values
  ;; @returns (response bool uint)
  (run ((buff 2048)) (response bool uint))
))

;; a voting contract for whitelisted pre-defined actions
;; has lower voting threshold and quorum than core proposals
(define-trait action-proposals (
  ;; propose a new action
  ;; @param action the action contract
  ;; @param parameters encoded action parameters
  ;; @returns (response bool uint)
  (propose-action (<action> (buff 2048) (optional (string-ascii 1024))) (response bool uint))
  ;; vote on an existing proposal
  ;; @param proposal the proposal id
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-proposal (uint bool) (response bool uint))
  ;; conclude a proposal after voting period
  ;; @param proposal the proposal id
  ;; @param action the action contract
  ;; @returns (response bool uint)
  (conclude-proposal (uint <action>) (response bool uint))
))

;; a smart contract that can be funded and assigned to a principal
;; withdrawals are based on a set amount and time period in blocks
(define-trait timed-vault (
  ;; set account holder
  ;; @param principal the new account holder who can withdraw
  ;; @returns (response bool uint)
  (set-account-holder (principal) (response bool uint))
  ;; set withdrawal period
  ;; @param period the new withdrawal period in Bitcoin blocks
  ;; @returns (response bool uint)
  (set-withdrawal-period (uint) (response bool uint))
  ;; set withdrawal amount
  ;; @param amount the new withdrawal amount in micro-units
  ;; @returns (response bool uint)
  (set-withdrawal-amount (uint) (response bool uint))
  ;; override last withdrawal block
  ;; @param block the new last withdrawal block
  ;; @returns (response bool uint)
  (override-last-withdrawal-block (uint) (response bool uint))
  ;; deposit funds to the timed vault
  ;; @param amount amount of token to deposit in micro-units
  ;; @returns (response bool uint)
  (deposit (uint) (response bool uint))
  ;; withdraw funds from the timed vault
  ;; @returns (response bool uint) 
  (withdraw () (response bool uint))
))

;; an extension to manage the dao charter and mission
;; allows the dao to define its mission and values on-chain
;; used to guide decision-making and proposals
(define-trait charter (
  ;; set the dao charter
  ;; @param charter the new charter text
  ;; @returns (response bool uint)
  (set-dao-charter ((string-ascii 4096) (optional (buff 33))) (response bool uint))
))

;; a voting contract for core dao proposals
;; has higher voting threshold and quorum than action proposals
;; can run any Clarity code in the context of the dao
(define-trait core-proposals (
  ;; create a new proposal
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (create-proposal (<proposal> (optional (string-ascii 1024))) (response bool uint))
  ;; vote on an existing proposal
  ;; @param proposal the proposal contract
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-proposal (<proposal> bool) (response bool uint))
  ;; conclude a proposal after voting period
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (conclude-proposal (<proposal>) (response bool uint))
))

;; a messaging contract that allows anyone to send public messages on-chain
;; messages can be up to 1MB in size and are printed as events that can be monitored
;; messages can verifiably indicate the sender is the dao by using a proposal
(define-trait messaging (
  ;; send a message on-chain (opt from DAO)
  ;; @param msg the message to send (up to 1MB)
  ;; @param isFromDao whether the message is from the DAO
  ;; @returns (response bool uint)
  (send ((string-ascii 1048576) bool) (response bool uint))
))

;; an invoicing contract that allows anyone to pay invoices
;; used in conjunction with the 'resources' trait
(define-trait invoices (
  ;; pay an invoice by ID
  ;; @param invoice the ID of the invoice
  ;; @returns (response uint uint)
  (pay-invoice (uint (optional (buff 34))) (response uint uint))
  ;; pay an invoice by resource name
  ;; @param name the name of the resource
  ;; @returns (response uint uint)
  (pay-invoice-by-resource-name ((string-utf8 50) (optional (buff 34))) (response uint uint))
))

;; a resource contract that allows for management of resources
;; resources can be paid for by anyone, and toggled on/off
;; used in conjunction with the 'invoices' trait for a payment system
(define-trait resources (
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
))

;; an extension that manages the token on behalf of the dao
;; allows for same functionality normally used by deployer through proposals
(define-trait token-owner (
  ;; set the token URI
  ;; @param value the new token URI
  ;; @returns (response bool uint)
  (set-token-uri ((string-utf8 256)) (response bool uint))
  ;; transfer ownership of the token
  ;; @param new-owner the new owner of the token
  ;; @returns (response bool uint)
  (transfer-ownership (principal) (response bool uint))
))

;; an extension that manages STX, SIP-009 NFTs, and SIP-010 tokens
;; also supports stacking STX with Stacks Proof of Transfer
(define-trait treasury (
  ;; allow an asset for deposit/withdrawal
  ;; @param token the asset contract principal
  ;; @param enabled whether the asset is allowed
  ;; @returns (response bool uint)
  (allow-asset (principal bool) (response bool uint))
  ;; allow multiple assets for deposit/withdrawal
  ;; @param allowList a list of asset contracts and enabled status
  ;; @returns (response bool uint)
  (allow-assets ((list 100 {token:principal,enabled:bool})) (response bool uint))
  ;; deposit STX to the treasury
  ;; @param amount amount of microSTX to deposit
  ;; @returns (response bool uint)
  (deposit-stx (uint) (response bool uint))
  ;; deposit FT to the treasury
  ;; @param ft the fungible token contract principal
  ;; @param amount amount of tokens to deposit
  ;; @returns (response bool uint)
  (deposit-ft (<ft-trait> uint) (response bool uint))
  ;; deposit NFT to the treasury
  ;; @param nft the non-fungible token contract principal
  ;; @param id the ID of the token to deposit
  ;; @returns (response bool uint)
  (deposit-nft (<nft-trait> uint) (response bool uint))
  ;; withdraw STX from the treasury
  ;; @param amount amount of microSTX to withdraw
  ;; @param recipient the recipient of the STX
  ;; @returns (response bool uint)
  (withdraw-stx (uint principal) (response bool uint))
  ;; withdraw FT from the treasury
  ;; @param ft the fungible token contract principal
  ;; @param amount amount of tokens to withdraw
  ;; @param recipient the recipient of the tokens
  ;; @returns (response bool uint)
  (withdraw-ft (<ft-trait> uint principal) (response bool uint))
  ;; withdraw NFT from the treasury
  ;; @param nft the non-fungible token contract principal
  ;; @param id the ID of the token to withdraw
  ;; @param recipient the recipient of the token
  ;; @returns (response bool uint)
  (withdraw-nft (<nft-trait> uint principal) (response bool uint))
  ;; delegate STX for stacking in PoX
  ;; @param amount max amount of microSTX that can be delegated
  ;; @param to the address to delegate to
  ;; @returns (response bool uint)
  (delegate-stx (uint principal) (response bool uint))
  ;; revoke delegation of STX from stacking in PoX
  ;; @returns (response bool uint)
  (revoke-delegate-stx () (response bool uint))
))
