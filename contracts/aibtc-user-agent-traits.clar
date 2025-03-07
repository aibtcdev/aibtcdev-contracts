;; title: aibtc-user-agent-traits
;; version: 1.0.0
;; summary: A collection of traits for user agent vaults

;; IMPORTS
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait action-trait .aibtc-dao-traits-v2.action)
(use-trait proposal-trait .aibtc-dao-traits-v2.proposal)
(use-trait action-proposals-trait .aibtc-dao-traits-v2.action-proposals)
(use-trait core-proposals-trait .aibtc-dao-traits-v2.core-proposals)

;; USER AGENT VAULT TRAIT

;; A vault contract that manages assets and DAO interactions between a user and an agent
(define-trait user-agent-vault (
  ;; Asset Management Functions
  
  ;; deposit STX to the vault
  ;; @param amount amount of microSTX to deposit
  ;; @returns (response bool uint)
  (deposit-stx (uint) (response bool uint))
  
  ;; deposit FT to the vault
  ;; @param ft the fungible token contract
  ;; @param amount amount of tokens to deposit
  ;; @returns (response bool uint)
  (deposit-ft (<ft-trait> uint) (response bool uint))
  
  ;; withdraw STX from the vault (user only)
  ;; @param amount amount of microSTX to withdraw
  ;; @returns (response bool uint)
  (withdraw-stx (uint) (response bool uint))
  
  ;; withdraw FT from the vault (user only)
  ;; @param ft the fungible token contract
  ;; @param amount amount of tokens to withdraw
  ;; @returns (response bool uint)
  (withdraw-ft (<ft-trait> uint) (response bool uint))
  
  ;; approve an asset for deposit/withdrawal (user only)
  ;; @param asset the asset contract principal
  ;; @returns (response bool uint)
  (approve-asset (principal) (response bool uint))
  
  ;; revoke approval for an asset (user only)
  ;; @param asset the asset contract principal
  ;; @returns (response bool uint)
  (revoke-asset (principal) (response bool uint))
  
  ;; DAO Interaction Functions
  
  ;; propose an action to the DAO (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param action the action contract
  ;; @param parameters encoded action parameters
  ;; @returns (response bool uint)
  (proxy-propose-action (<action-proposals-trait> <action-trait> (buff 2048)) (response bool uint))
  
  ;; create a core proposal to the DAO (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (proxy-create-proposal (<core-proposals-trait> <proposal-trait>) (response bool uint))
  
  ;; vote on an action proposal (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param proposalId the proposal ID
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-action-proposal (<action-proposals-trait> uint bool) (response bool uint))
  
  ;; vote on a core proposal (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-core-proposal (<core-proposals-trait> <proposal-trait> bool) (response bool uint))
  
  ;; conclude an action proposal (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param proposalId the proposal ID
  ;; @param action the action contract
  ;; @returns (response bool uint)
  (conclude-action-proposal (<action-proposals-trait> uint <action-trait>) (response bool uint))
  
  ;; conclude a core proposal (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (conclude-core-proposal (<core-proposals-trait> <proposal-trait>) (response bool uint))
))
