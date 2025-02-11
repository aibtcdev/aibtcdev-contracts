;; title: aibtc-dao-charter
;; version: 1.0.0
;; summary: An extension that manages the DAO charter and records the DAO's mission and values on-chain.
;; description: This contract allows the DAO to define its mission and values on-chain, which can be used to guide decision-making and proposals.
;; The charter is editable by the DAO through proposal with revisions stored on-chain. Community activates the DAO through calling a public function.

;; traits
;;
(impl-trait .aibtc-dao-traits-v2.extension)
(impl-trait .aibtc-dao-traits-v2.charter)

;; constants
;;
(define-constant SELF (as-contract tx-sender))
(define-constant REQUIRED_VOTES u100) ;; 100 votes to activate the DAO

;; error codes
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8000))
(define-constant ERR_DAO_ALREADY_ACTIVATED (err u8001))
(define-constant ERR_DAO_NOT_ACTIVATED (err u8002))
(define-constant ERR_ALREADY_VOTED (err u8003))
(define-constant ERR_SAVING_CHARTER (err u8004))
(define-constant ERR_CHARTER_TOO_SHORT (err u8005))

;; data vars
;;
(define-data-var daoActivated bool false)
(define-data-var daoCharter (string-ascii 4096) "<%= it.dao_charter %>")
(define-data-var currentVersion uint u0)
(define-data-var activationVotes uint u0)

;; data maps
;;
(define-map CharterVersions
  uint ;; version number
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
    charter: (string-ascii 4096), ;; charter text
    inscriptionId: (optional (buff 33))  ;; 32 bytes for txid + 1 byte for index
  }
)

(define-map ActivationVotes
  principal ;; voter
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
  }
)

;; public functions
;;
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (vote-to-activate)
  (let
    (
      (newVoteCount (+ (var-get activationVotes) u1))
    )
    ;; check if dao is already activated
    (asserts! (not (var-get daoActivated)) ERR_DAO_ALREADY_ACTIVATED)
    ;; add voter to activation votes, must be unique
    (asserts! (map-insert ActivationVotes tx-sender {
      burnHeight: burn-block-height,
      createdAt: block-height,
      caller: contract-caller,
      sender: tx-sender
    }) ERR_ALREADY_VOTED)
    ;; print voter info
    (print {
      notification: "vote-to-activate",
      payload: {
        burnHeight: burn-block-height,
        createdAt: block-height,
        caller: contract-caller,
        sender: tx-sender,
        dao: SELF,
        totalVotes: newVoteCount
      }
    })
    ;; increment activation votes
    (var-set activationVotes newVoteCount)
    ;; return and trigger activation if required votes are met
    (ok (if (>= newVoteCount REQUIRED_VOTES)
      (try! (activate-dao))
      true
    ))
  )
)

(define-public (set-dao-charter (charter (string-ascii 4096)) (inscriptionId (optional (buff 33))))
  (begin
    ;; check if dao is activated
    (asserts! (var-get daoActivated) ERR_DAO_NOT_ACTIVATED)
    ;; check if sender is dao or extension
    (try! (is-dao-or-extension))
    ;; check length of charter
    (asserts! (>= (len charter) u1) ERR_CHARTER_TOO_SHORT)
    ;; insert new charter version
    (asserts! (map-insert CharterVersions (var-get currentVersion) {
      burnHeight: burn-block-height,
      createdAt: block-height,
      caller: contract-caller,
      sender: tx-sender,
      charter: charter,
      inscriptionId: inscriptionId
    }) ERR_SAVING_CHARTER)
    ;; print charter info
    (print {
      notification: "set-dao-charter",
      payload: {
        burnHeight: burn-block-height,
        createdAt: block-height,
        caller: contract-caller,
        sender: tx-sender,
        dao: SELF,
        charter: charter,
        inscriptionId: inscriptionId
      }
    })
    ;; increment charter version
    (var-set currentVersion (+ (var-get currentVersion) u1))
    ;; set new charter
    (var-set daoCharter charter)
    ;; return success
    (ok true)
  )
)


;; read only functions
;;

(define-read-only (is-dao-activated)
  {
    dao: SELF,
    activated: (var-get daoActivated),
    votes: (var-get activationVotes)
  }
)

(define-read-only (get-activation-vote-record (who principal))
  (map-get? ActivationVotes who)
)

(define-read-only (get-current-dao-charter-version)
  (if (> (var-get currentVersion) u0)
    (some (var-get currentVersion))
    none
  )
)

(define-read-only (get-current-dao-charter)
  (if (> (var-get currentVersion) u0)
    (some (var-get daoCharter))
    none
  )
)

(define-read-only (get-dao-charter (version uint))
  (map-get? CharterVersions version)
)

;; private functions
;;
(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-base-dao)
    (contract-call? .aibtcdev-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)

(define-private (activate-dao)
  (begin
    ;; set activation status in this contract
    (var-set daoActivated true)
    ;; activate disabled extensions in the dao
    (try! (contract-call? .aibtcdev-base-dao set-extensions
      (list
        {extension: .aibtc-action-proposals-v2, enabled: true}
        {extension: .aibtc-bank-account, enabled: true}
        {extension: .aibtc-core-proposals-v2, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-payments-invoices, enabled: true}
        {extension: .aibtc-token-owner, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
      )
    ))
    ;; print dao activated
    (print {
      notification: "dao-activated",
      payload: {
        burnHeight: burn-block-height,
        createdAt: block-height,
        caller: contract-caller,
        sender: tx-sender,
        dao: SELF,
        charter: (var-get daoCharter)
      }
    })
    ;; return success
    (ok true)
  )
)
