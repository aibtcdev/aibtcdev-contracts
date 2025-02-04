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
(define-constant REQUIRED_VOTES u100) ;; 100 votes to activate the DAO

;; error codes
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u8000))

;; data vars
;;
(define-data-var daoActivated bool false)
(define-data-var daoCharter (string-ascii 280) "")
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
    charter: (string-ascii 280), ;; charter text
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

(define-public (activate-dao-charter)
  (ok true)
)

(define-public (set-dao-charter (charter (string-ascii 280)))
  (ok true)
)


;; read only functions
;;

(define-read-only (is-dao-activated)
  {
    activated: (var-get daoActivated),
    votes: (var-get activationVotes)
  }
)

(define-read-only (get-activation-vote-record (who principal))
  (map-get? ActivationVotes who)
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

;; TODO: function to update dao extension status