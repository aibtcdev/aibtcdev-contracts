(use-trait proposal-trait .aibtc-dao-traits-v2.proposal)
(use-trait extension-trait .aibtc-dao-traits-v2.extension)

(define-trait aibtc-base-dao (
    ;; Execute a governance proposal
    (execute (<proposal-trait> principal) (response bool uint))
    ;; Enable or disable an extension contract
    (set-extension (principal bool) (response bool uint))
    ;; Request extension callback
    (request-extension-callback (<extension-trait> (buff 34)) (response bool uint))
))
