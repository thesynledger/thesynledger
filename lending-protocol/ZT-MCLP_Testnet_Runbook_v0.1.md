# Zero‑Trust Multi‑Chain Lending Protocol — Testnet Runbook (v0.1)

*Primary:* **Sui Testnet**  
*External chains (test):* **Bitcoin Testnet (tBTC)**, **Ethereum Sepolia (optional/stretch)**  
*Custody:* **dWallets (Ika 2PC‑MPC 2PC)**  
*Goal:* End‑to‑end demo — **BTC collateral → Borrow SUI USDC → Price drop → Liquidation on BTC testnet → Repay/Close**

---

## 1) Prerequisites

### 1.1 Tooling
- **Sui CLI** (latest testnet)  
- **Node.js 20+** (frontend + relayer/keeper scripts)
- **Python 3.11+** (optional utilities)
- **Docker** (optional for local MPC node simulators)
- **jq**, **curl**, **git**

### 1.2 Keys / Accounts
- **Sui wallet** with testnet SUI (for gas).  
- **BTC testnet wallet** (for funding collateral to the BTC dWallet address).  
- **(Optional) Sepolia wallet** with test ETH for stretch goals.

### 1.3 Environment Variables (template)
Create `.env` in the repo root:
```
# SUI
SUI_NETWORK=testnet
SUI_PKG_ADDR=0x{to_fill_after_deploy}
SUI_OWNER_ADDR=0x{your_sui_addr}

# dWALLET / MPC
MPC_CLUSTER_RPC=http://localhost:7000
MPC_POLICY_HASH=0x{32B_policy_hash}
MPC_AUTHORITY_PKG=0x{SUI_PACKAGE_ADDR}

# ORACLES
ORACLE_SET_ID=default-test
ORACLE_STALENESS_MS=90000
ORACLE_DIVERGENCE_BPS=250

# BITCOIN TESTNET
BTC_NETWORK=testnet
BTC_DWALLET_ADDR=tb1q{filled_by_policy_bind}
BTC_MIN_CONF=3

# LENDER / BORROWER (demo)
LENDER_PAYOUT_BTC=tb1q{lender_btc_addr}
BORROWER_WITHDRAW_BTC=tb1q{borrower_btc_addr}
```

---

## 2) Deployment Order

1. **Compile & publish Sui packages** (`core`, `risk`, `oracle`, `utils`).  
2. **Seed Risk Params** for BTC (collateral) & SUI/USDC (debt).  
3. **Create Offer** (lender) with conservative risk cfg.  
4. **Accept Offer** (borrower) — this instantiates Loan + binds dWallet Policy + registers FTTs.  
5. **Register BTC deposit** (attestation) → move Loan → **Active**.  
6. **Draw** USDC (escrowed or direct‑outflow).  
7. **Simulate price drop** (oracle) to breach HF.  
8. **Liquidate** (keeper or lender) — native BTC transfer from dWallet to lender.  
9. **Repay/Close** (optional path if not fully liquidated).

---

## 3) Commands (reference)

> Replace placeholders in `<>` and env vars as needed. Sui commands assume a configured keystore/profile.

### 3.1 Build & Publish
```bash
sui move build
sui client publish --gas-budget 200000000 \
  --skip-fetch-latest-gas-price \
  --json > publish.out.json

export SUI_PKG_ADDR=$(jq -r '.objectChanges[] | select(.type=="published") | .packageId' publish.out.json)
echo "SUI_PKG_ADDR=$SUI_PKG_ADDR"
```

### 3.2 Set Risk Params
```bash
# Example: BTC collateral
sui client call \
  --package $SUI_PKG_ADDR \
  --module risk \
  --function set_params \
  --args \
    '{"asset":"0x424443","chain":"0x424954434f494e","max_ltv_bps":6500,"lt_bps":7000,"liq_bonus_bps":750,"haircut_vol_bps":500,"haircut_chain_bps":200,"min_conf":3,"oracle_ids":[],"version":1}' \
  --gas-budget 50000000

# Example: SUI/USDC borrow
sui client call \
  --package $SUI_PKG_ADDR \
  --module risk \
  --function set_params \
  --args \
    '{"asset":"0x55534443","chain":"0x535549","max_ltv_bps":9000,"lt_bps":9200,"liq_bonus_bps":100,"haircut_vol_bps":0,"haircut_chain_bps":0,"min_conf":0,"oracle_ids":[],"version":1}' \
  --gas-budget 50000000
```

### 3.3 Create Offer (Lender)
```bash
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function create_offer \
  --args '<OFFER_PARAMS_BCS_BYTES>'  '10' \
  --gas-budget 70000000
# Capture OfferObject id from events → $OFFER_ID
```

### 3.4 Accept Offer (Borrower)
```bash
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function accept_offer \
  --args "$OFFER_ID" "0x<LENDER_ADDR>" '<LOAN_CFG_BCS>' '<COLLATERAL_SPEC_BCS>' '<DEBT_SPEC_BCS>' \
  --gas-budget 120000000
# Capture LoanObject, PolicyObject, FTTObject ids → $LOAN_ID, $POLICY_ID, $FTT_LIQ_ID
```

### 3.5 Fund BTC Collateral (off‑chain)
- UI shows **BTC dWallet address** bound to `$POLICY_ID`.  
- From your BTC testnet wallet, **send collateral** (e.g., 0.05 tBTC) to that address.  
- Wait for **3 confirmations**.

### 3.6 Register Collateral Deposit (Attestation)
```bash
# Produce attestation JSON: {"txid":"<hex>","amount":5000000,"conf":3,"proof":"<opaque-bytes>"}
RELAYER=./scripts/make_btc_attestation.js
node $RELAYER --txid <txid> --amount 5000000 --conf 3 > att.json

sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function register_collateral_deposit \
  --args "$LOAN_ID" "$(jq -r -c tostring att.json)" "5000000" "<txid_bytes>" "3" \
  --gas-budget 80000000
# Expect event: ECollateralLocked; Loan state → Active
```

### 3.7 Draw Borrow Asset
```bash
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function draw \
  --args "$LOAN_ID" "1000000000" \
  --gas-budget 60000000
```

### 3.8 Trigger Liquidation (simulate price drop)
```bash
# Update oracle: push lower BTC price (dev oracle adapter script)
node scripts/push_oracle.js --pair BTC/USD --price 50000 --round $((RANDOM%100000))
# Check health
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function check_health \
  --args "$LOAN_ID" \
  --gas-budget 40000000
# If HF < 1.0, proceed to liquidate
```

### 3.9 Execute Liquidation
```bash
# Keeper obtains Sui authorization event (ELiquidationTriggered) with ftt bounds
# Keeper submits to MPC cluster which signs BTC transfer

node scripts/execute_liquidation.js --loan $LOAN_ID --ftt $FTT_LIQ_ID \
  --mpc $MPC_CLUSTER_RPC --lender $LENDER_PAYOUT_BTC

# After BTC tx confirmed, keeper posts receipt to Sui (optional)
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function liquidate \
  --args "$LOAN_ID" "2000000" "$FTT_LIQ_ID" \
  --gas-budget 70000000
```

### 3.10 Repay & Close (if not fully liquidated)
```bash
sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function repay \
  --args "$LOAN_ID" "1000000000" "0x535549" \
  --gas-budget 50000000

sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function repay_full \
  --args "$LOAN_ID" \
  --gas-budget 50000000

sui client call \
  --package $SUI_PKG_ADDR \
  --module core \
  --function authorize_collateral_withdrawal \
  --args "$LOAN_ID" "$FTT_WITHDRAW_ID" \
  --gas-budget 60000000
```

---

## 4) Demo Script (one‑click)

Create `scripts/demo.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Publishing packages…"
# (publish and export SUI_PKG_ADDR)

echo "Seeding risk params…"
# (set_params for BTC & USDC)

echo "Creating offer…"
# (create_offer → export OFFER_ID)

echo "Accepting offer…"
# (accept_offer → export LOAN_ID, POLICY_ID, FTT_LIQ_ID)

echo ">>> Deposit BTC to: $(jq -r .btc_addr policy.json) and wait 3 conf"
read -p "Press enter after deposit confirmed…"

echo "Registering deposit…"
# (register_collateral_deposit)

echo "Drawing borrow asset…"
# (draw)

echo "Simulating price drop…"
node scripts/push_oracle.js --pair BTC/USD --price 50000

echo "Checking health & liquidating…"
# (check_health, then execute_liquidation)

echo "Done. Inspect events and dashboard."
```

---

## 5) Observability

### 5.1 Event Subscriptions
Subscribe to Sui events by package to build a lightweight indexer:
- `ELoanCreated`, `ECollateralLocked`, `EDrawn`, `ERepaid`, `ELiquidationTriggered`, `ELiquidationExecuted`, `EClosed`

### 5.2 KPIs for demo
- **Time to Liquidate:** `ELiquidationTriggered.ts → BTC tx inclusion`.  
- **Oracle Freshness:** last update age ≤ 90s.  
- **Health Factor trace:** sequence of HF before/after draw/liquidation.

---

## 6) Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `E_PRICE_STALE` | Oracle not updated | Run `push_oracle.js`; verify `staleness_ms` |
| `E_PRICE_DIVERGENCE` | Sources disagree > τ | Align feeds; increase τ only on test |
| Deposit not recognized | Proof format mismatch | Check attestation serializer; endian/hex casing |
| Liquidation not executing | MPC policy hash mismatch | Ensure `policy_hash` equals on‑chain event |
| Loan stuck `LiquidationPending` | BTC tx not confirmed | Wait conf or bump fee; re‑submit via keeper |
| `E_MIN_CONF` | Below required conf | Wait additional blocks; re‑register |

---

## 7) Data Artifacts to Capture
- `publish.out.json` (package address)  
- `risk_params.json` (for each asset)  
- `offer.out.json`, `loan.out.json`  
- `policy.json` (dWallet address, policy_hash)  
- `oracle_rounds.json`  
- `liquidation_receipt.json`

Store artifacts under `./artifacts/` for reproducibility.

---

## 8) Security Checkpoints (pre‑audit)
- Confirm **no privileged path** can move funds without `FTT + policy_hash` auth.  
- Verify **single‑use nonce** on FTTs.  
- Run **property tests**: accounting invariants, idempotent deposit registration, bounds on liquidation amount.

---

## 9) Stretch: Sepolia Collateral
- Add `ETH` risk params (`min_conf = 12 blocks`).  
- Bind Sepolia dWallet policy and register ERC‑20 debt on Sui (wrapped test USDC for UX parity).  
- Repeat flow with **ETH collateral → borrow SUI USDC**.

---

## 10) Appendix — Minimal Frontend Checklist
- Wallet connect (Sui) + address book (BTC lender/borrower).  
- Offer list & accept flow.  
- Loan dashboard (HF bar with latency buffer).  
- Deposit tracker (poll tBTC mempool + confs).  
- Liquidation simulator UI (oracle price slider).

---

**End of Runbook v0.1** — This file is intended to be used alongside the Formal Spec, Risk Table, and Move API/ABI documents.
