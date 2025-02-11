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
(define-constant REQUIRE_VOTES_TO_ACTIVATE false) ;; require vote to activate the DAO
(define-constant REQUIRED_VOTES u100) ;; 100 votes to activate the DAO

;; template vars
(define-constant CFG_DAO_CHARTER_TEXT "<%= it.dao_charter %>")
(define-constant CFG_DAO_CHARTER_INSCRIPTION_ID 0x000000000000000000000000000000000000000000000000000000000000000000) ;; <%= it.dao_charter_inscription_id %> as (buff 33)
(define-constant CFG_EXTENSION_LIST
  (list
    {extension: .aibtc-action-proposals-v2, enabled: true}
    {extension: .aibtc-bank-account, enabled: true}
    {extension: .aibtc-core-proposals-v2, enabled: true}
    {extension: .aibtc-onchain-messaging, enabled: true}
    {extension: .aibtc-payments-invoices, enabled: true}
    {extension: .aibtc-token-owner, enabled: true}
    {extension: .aibtc-treasury, enabled: true}
  )
)

;; error codes
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8000))
(define-constant ERR_DAO_ALREADY_ACTIVATED (err u8001))
(define-constant ERR_DAO_NOT_ACTIVATED (err u8002))
(define-constant ERR_ALREADY_VOTED (err u8003))
(define-constant ERR_SAVING_CHARTER (err u8004))
(define-constant ERR_CHARTER_TOO_SHORT (err u8005))
(define-constant ERR_CHARTER_TOO_LONG (err u8006))

;; data vars
;;
(define-data-var daoActivated bool false)
(define-data-var daoCharter (string-ascii 4096) "")
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

;; direct execution
;;

;; TODO: dao has to be in place first, might be easier to refactor this to a private function, and put a public call on the front we can use to initialize. Separate what happens after the vote from the vote and give two ways to execute it depending on if needed or not. Also helps DRY code.

;; check length of charter text
(asserts! (>= (len CFG_DAO_CHARTER_TEXT) u1) ERR_CHARTER_TOO_SHORT)
(asserts! (<= (len CFG_DAO_CHARTER_TEXT) u4096) ERR_CHARTER_TOO_LONG)
;; set initial dao charter based on template vars
(var-set daoCharter CFG_DAO_CHARTER_TEXT)
(var-set currentVersion u1)
(map-insert CharterVersions u1 {
  burnHeight: burn-block-height,
  createdAt: block-height,
  caller: contract-caller,
  sender: tx-sender,
  charter: (var-get daoCharter),
  inscriptionId: (some CFG_DAO_CHARTER_INSCRIPTION_ID)
})
;; activate dao on deployment if voting is not required
(and (not REQUIRE_VOTES_TO_ACTIVATE) (try! (activate-dao)))    

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
  (let
    (
      (newVersion (+ (var-get currentVersion) u1))
    )
    ;; check if dao is activated
    (asserts! (var-get daoActivated) ERR_DAO_NOT_ACTIVATED)
    ;; check if sender is dao or extension
    (try! (is-dao-or-extension))
    ;; check length of charter
    (asserts! (>= (len charter) u1) ERR_CHARTER_TOO_SHORT)
    (asserts! (<= (len charter) u4096) ERR_CHARTER_TOO_LONG)
    ;; insert new charter version
    (asserts! (map-insert CharterVersions newVersion {
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
        inscriptionId: inscriptionId,
        version: newVersion
      }
    })
    ;; increment charter version
    (var-set currentVersion newVersion)
    ;; set new charter
    (var-set daoCharter charter)
    ;; return success
    (ok true)
  )
)


;; read only functions
;;

(define-read-only (is-dao-activated)
  (var-get daoActivated)
)

(define-read-only (get-activation-status)
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
    (try! (contract-call? .aibtcdev-base-dao set-extensions CFG_EXTENSION_LIST))
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
