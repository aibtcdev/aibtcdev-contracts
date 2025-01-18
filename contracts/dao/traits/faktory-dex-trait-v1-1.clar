(use-trait faktory-token .faktory-trait-v1.sip-010-trait) ;; 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE

(define-trait dex-trait
  (
    ;; buy from the bonding curve dex
    (buy (<faktory-token> uint) (response bool uint))

    ;; sell from the bonding curve dex
    (sell (<faktory-token> uint) (response bool uint))

    ;; the status of the dex
    (get-open () (response bool uint))

    ;; data to inform a buy
    (get-in (uint) (response {
        total-stx: uint,
        total-stk: uint, ;; new
        ft-balance: uint,
        k: uint, ;; new
        fee: uint,
        stx-in: uint,
        new-stk: uint, ;; new
        new-ft: uint,
        tokens-out: uint,
        new-stx: uint,
        stx-to-grad: uint
    } uint))

    ;; data to inform a sell
    (get-out (uint) (response {
        total-stx: uint,
        total-stk: uint, ;; new
        ft-balance: uint,
        k: uint, ;; new
        new-ft: uint,
        new-stk: uint, ;; new
        stx-out: uint,
        fee: uint,
        stx-to-receiver: uint,
        amount-in: uint,
        new-stx: uint,
    } uint))
  )
)