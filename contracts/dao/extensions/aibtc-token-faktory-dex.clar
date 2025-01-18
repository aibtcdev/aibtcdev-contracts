;; SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.ai1-faktory-dex
;; 99af7ff63e5e4bd7542e55d88bacc25a7a6f79004f9937ea0bab3ca4c2438061
  ;; aibtc.dev DAO faktory.fun DEX @version 1.0

  (impl-trait .aibtcdev-dao-traits-v1-1.faktory-dex) ;; <%= it.token_faktory_dex_trait %>
  (impl-trait .faktory-dex-trait-v1.dex-trait) ;; <%= it.faktory_dex_trait %>
  (use-trait faktory-token .faktory-trait-v1.sip-010-trait) ;; <%= it.faktory_sip10_trait %>
  
  (define-constant ERR-MARKET-CLOSED (err u1001))
  (define-constant ERR-STX-NON-POSITIVE (err u1002))
  (define-constant ERR-STX-BALANCE-TOO-LOW (err u1003))
  (define-constant ERR-FT-NON-POSITIVE (err u1004))
  (define-constant ERR-FETCHING-BUY-INFO (err u1005))
  (define-constant ERR-FETCHING-SELL-INFO (err u1006))
  (define-constant ERR-TOKEN-NOT-AUTH (err u401))
  (define-constant ERR-UNAUTHORIZED-CALLER (err u402))
  
  (define-constant FEE-RECEIVER 'ST3S2565C4DP2MGR3CMANMGYDCDA314Q25AQGR26R) ;; 'SMHAVPYZ8BVD0BHBBQGY5AQVVGNQY4TNHAKGPYP)
  (define-constant G-RECEIVER 'ST3CZY55VJE5P5DJAP5E58X123BZKMYDCNEZMRTV2) ;;'SM3NY5HXXRNCHS1B65R78CYAC1TQ6DEMN3C0DN74S)

  (define-constant CANT-BE-EVIL 'ST000000000000000000002AMW42H) ;;'SP000000000000000000002Q6VF78)
  (define-constant DEX-TOKEN .aibtc-token-faktory) ;; SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22
  (define-constant AUTHORIZED-CONTRACT .buy-with-velar-faktory) ;; 'SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.buy-with-velar-faktory)
  
  ;; token constants
  (define-constant TARGET_STX u2000000000) ;; <%= it.stx_target_amount %>
  (define-constant FAK_STX u400000000) ;; <%= it.virtual_stx_value %> 1/5 of STX_TARGET_AMOUNT
  (define-constant GRAD-FEE u40000000) ;; <%= it.complete_fee % > 2% of STX_TARGET_AMOUNT
  
  ;; data vars
  (define-data-var open bool false)
  (define-data-var fak-ustx uint u0)
  (define-data-var ft-balance uint u0) ;; <%= it.token_max_supply %> match with the token's supply (use decimals)
  (define-data-var stx-balance uint u0)
  (define-data-var burn-rate uint u25)
  
  ;; Helper function to check if caller is authorized
  ;; TODO: does this prevent a proxy contract?
  (define-private (is-valid-caller)
    (or 
      (is-eq contract-caller tx-sender)
      (is-eq contract-caller AUTHORIZED-CONTRACT)
    ))
  
  (define-public (buy (ft <faktory-token>) (ustx uint))
    (begin
      (asserts! (is-eq DEX-TOKEN (contract-of ft)) ERR-TOKEN-NOT-AUTH)
      ;; TODO: review proxy contract usage
      (asserts! (is-valid-caller) ERR-UNAUTHORIZED-CALLER)
      (asserts! (var-get open) ERR-MARKET-CLOSED)
      (asserts! (> ustx u0) ERR-STX-NON-POSITIVE)
      ;; TODO: use get-in function
      ;; needs to return all values from get-in params
      ;;(let
      ;;  (
      ;;    (in-info (unwrap! (get-in ustx) ERR-FETCHING-BUY-INFO))
      ;;    (total-stx (get total-stx in-info))
      ;;    (total-stk (get total-stk in-info))
      ;;    (total-ft (get ft-balance in-info))
      ;;    (k (get k in-info))
      ;;    (fee (get fee in-info))
      ;;    (stx-in (get stx-in in-info))
      ;;    (new-stk (get new-stk in-info))
      ;;    (new-ft (get new-ft in-info))
      ;;    (tokens-out (get tokens-out in-info))
      ;;    (new-stx (get new-stx in-info))
      ;;    (ft-receiver tx-sender)
      ;;  )
      ;;  true
      ;;)
      (let ((total-stx (var-get stx-balance))
            (total-stk (+ total-stx (var-get fak-ustx)))
            (total-ft (var-get ft-balance))
            (k (* total-ft total-stk))
            (fee (/ (* ustx u2) u100))
            (stx-in (- ustx fee))
            (new-stk (+ total-stk stx-in))
            (new-ft (/ k new-stk))
            (tokens-out (- total-ft new-ft))
            (new-stx (+ total-stx stx-in))
            (ft-receiver tx-sender))
        (try! (stx-transfer? fee tx-sender FEE-RECEIVER))
        (try! (stx-transfer? stx-in tx-sender (as-contract tx-sender)))
        (try! (as-contract (contract-call? ft transfer tokens-out tx-sender ft-receiver none)))
        ;; TODO: short-circuit if with and
        (if (>= new-stx TARGET_STX)
          ;; TODO: remove duplicate begin/let statement
          (begin
            (let ((burn-amount (/ (* new-ft (var-get burn-rate)) u100))
                  (amm-amount (- new-ft burn-amount))
                  (amm-ustx (- new-stx GRAD-FEE))
                  (xyk-pool-uri (default-to u"https://bitflow.finance" (try! (contract-call? ft get-token-uri))))
                  (xyk-burn-amount (- (sqrti (* amm-ustx amm-amount)) u1)))
              (try! (as-contract (contract-call? ft transfer burn-amount tx-sender CANT-BE-EVIL none)))
            ;; TODO: add actual graduation
            ;;   (try! (as-contract 
            ;;          (contract-call? 
            ;;            'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2 
            ;;                create-pool 
            ;;                'SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.xyk-pool-stx-ai1-v1-1
            ;;                'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2 
            ;;                ft
            ;;                amm-ustx 
            ;;                amm-amount 
            ;;                xyk-burn-amount 
            ;;                u10 u40 u10 u40 
            ;;                'SP31C60QVZKZ9CMMZX73TQ3F3ZZNS89YX2DCCFT8P xyk-pool-uri true)))
              (try! (as-contract (stx-transfer? GRAD-FEE tx-sender G-RECEIVER)))
              (var-set open false)
              (var-set stx-balance u0)
              (var-set ft-balance u0)
              (print {type: "buy", ft: (contract-of ft), tokens-out: tokens-out, ustx: ustx, burn-amount: burn-amount, amm-amount: amm-amount,
                      amm-ustx: amm-ustx,
                      stx-balance: u0, ft-balance: u0,
                      fee: fee, grad-fee: GRAD-FEE, maker: tx-sender,
                      open: false})
              (ok true)))
          (begin
            (var-set stx-balance new-stx)
            (var-set ft-balance new-ft)
            (print {type: "buy", ft: (contract-of ft), tokens-out: tokens-out, ustx: ustx, maker: tx-sender,
                    stx-balance: new-stx, ft-balance: new-ft,
                    fee: fee,
                    open: true})
            (ok true))))))
  
  (define-read-only (get-in (ustx uint))
    (let ((total-stx (var-get stx-balance))
          (total-stk (+ total-stx (var-get fak-ustx)))
          (total-ft (var-get ft-balance))
          (k (* total-ft total-stk))
          (fee (/ (* ustx u2) u100))
          (stx-in (- ustx fee))
          (new-stk (+ total-stk stx-in))
          (new-ft (/ k new-stk))
          (tokens-out (- total-ft new-ft))
          (raw-to-grad (- TARGET_STX total-stx))
          (stx-to-grad (/ (* raw-to-grad u103) u100)))
      (ok {
        total-stx: total-stx,
        ;; total-stk: total-stk,
        ft-balance: total-ft,
        ;; k: k,
        fee: fee,
        stx-in: stx-in,
        ;; new-stk: new-stk,
        new-ft: new-ft,
        tokens-out: tokens-out,
        new-stx: (+ total-stx stx-in),
        stx-to-grad: stx-to-grad
      })))
  
  (define-public (sell (ft <faktory-token>) (amount uint))
    (begin
      (asserts! (is-eq DEX-TOKEN (contract-of ft)) ERR-TOKEN-NOT-AUTH)
      ;; TODO: review proxy contract usage
      (asserts! (is-valid-caller) ERR-UNAUTHORIZED-CALLER)
      (asserts! (var-get open) ERR-MARKET-CLOSED)
      (asserts! (> amount u0) ERR-FT-NON-POSITIVE)
      ;; TODO: use get-out function
      ;; needs to return all values from get-in params
      ;;(let
      ;;  (
      ;;    (out-info (unwrap! (get-out amount) ERR-FETCHING-SELL-INFO))
      ;;    (total-stx (get total-stx out-info))
      ;;    (total-stk (get total-stk out-info))
      ;;    (total-ft (get ft-balance out-info))
      ;;    (k (get k out-info))
      ;;    (new-ft (get new-ft out-info))
      ;;    (new-stk (get new-stk out-info))
      ;;    (stx-out (get stx-out out-info))
      ;;    (fee (get fee out-info))
      ;;    (stx-to-receiver (get stx-to-receiver out-info))
      ;;    (new-stx (get new-stx out-info))
      ;;    (stx-receiver tx-sender)
      ;;  )
      ;;  true
      ;;)
      (let ((total-stx (var-get stx-balance))
            (total-stk (+ total-stx (var-get fak-ustx)))
            (total-ft (var-get ft-balance))
            (k (* total-ft total-stk))
            (new-ft (+ total-ft amount))
            (new-stk (/ k new-ft))
            (stx-out (- (- total-stk new-stk) u1))
            (fee (/ (* stx-out u2) u100))
            (stx-to-receiver (- stx-out fee))
            (new-stx (- total-stx stx-out))
            (stx-receiver tx-sender))
        (asserts! (>= total-stx stx-out) ERR-STX-BALANCE-TOO-LOW)
        (try! (contract-call? ft transfer amount tx-sender (as-contract tx-sender) none))
        (try! (as-contract (stx-transfer? stx-to-receiver tx-sender stx-receiver)))
        (try! (as-contract (stx-transfer? fee tx-sender FEE-RECEIVER)))
        (var-set stx-balance new-stx)
        (var-set ft-balance new-ft)
        (print {type: "sell", ft: (contract-of ft), amount: amount, stx-to-receiver: stx-to-receiver, maker: tx-sender,
                stx-balance: new-stx, ft-balance: new-ft,
                fee: fee,
                open: true})
        (ok true))))
  
  (define-read-only (get-out (amount uint))
    (let ((total-stx (var-get stx-balance))
          (total-stk (+ total-stx (var-get fak-ustx)))
          (total-ft (var-get ft-balance))
          (k (* total-ft total-stk))
          (new-ft (+ total-ft amount))
          (new-stk (/ k new-ft))
          (stx-out (- (- total-stk new-stk) u1))
          (fee (/ (* stx-out u2) u100))
          (stx-to-receiver (- stx-out fee)))
      (ok {
        total-stx: total-stx,
        ;; total-stk: total-stk,
        ft-balance: total-ft,
        ;; k: k,
        new-ft: new-ft,
        ;; new-stk: new-stk,
        stx-out: stx-out,
        fee: fee,
        stx-to-receiver: stx-to-receiver,
        amount-in: amount,
        new-stx: (- total-stx stx-out)
      })))
  
  (define-read-only (get-open)
    (ok (var-get open)))
  
  ;; boot dex
    (begin
      (var-set fak-ustx FAK_STX)
      (var-set ft-balance u13800000000000)
      (var-set stx-balance u0)
      (var-set open true)
      (try! (stx-transfer? u500000 tx-sender 'ST3S2565C4DP2MGR3CMANMGYDCDA314Q25AQGR26R)) ;;'SMH8FRN30ERW1SX26NJTJCKTDR3H27NRJ6W75WQE))
        (print { 
            type: "faktory-dex-trait-v1", 
            dexContract: (as-contract tx-sender),
            ;; ammReceiver: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2,
            ;; poolName: 'SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.xyk-pool-stx-ai1-v1-1
       })
      (ok true))
