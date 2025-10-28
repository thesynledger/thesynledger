# Zero-Trust Multi-Chain Lending — Technical & Product Blueprint

## 1) Core Principles
- **Native-in / native-out:** No wrapping or custodians. Collateral and borrows stay on their home chains.
- **Smart-contract enforced (Sui):** All terms/rights are encoded in Sui Move modules; no human/operator discretion.
- **Keyless & zero-trust custody:** dWallets (Ika 2PC-MPC) hold collateral across chains; Sui contracts gate every action.
- **P2P loans:** Borrower ↔ Lender bilateral terms; privacy of counterparties is preserved while terms are on-chain.
- **Deterministic liquidations:** Triggerable by lenders (or keepers) when oracle conditions are met, via pre-authorized future transactions.

---

## 2) High-Level Architecture

**On Sui:**
- **Lending Core (Move):** Markets, positions, collateral factors, interest model, liquidation logic.
- **Vault Controller:** Manages loan state and creates/owns dWallet controllers.
- **Oracle Adapter(s):** Normalizes multi-chain price feeds.
- **Fee & Treasury Module:** Protocol fees, referral splits, safety module.

**Off Sui (per external chain):**
- **dWallets:** Threshold-controlled accounts anchored in Sui contract logic.
- **Execution Relayer(s):** Stateless submitters for Sui-authorized bundles.
- **Keepers:** Watchers that trigger liquidations when HF < 1.0.

**Front-End:**
- Cross-chain dashboard for collateral, borrow, repay, withdraw.
- Signature + transaction flow integrated with Sui wallet & dWallet UX.

---

## 3) dWallet + 2PC-MPC Control Pattern

**Goal:** Zero-trust custody.

1. Sui contract creates Loan Object + dWallet per chain.
2. Policy embedded: signing conditions tied to Sui Loan Object.
3. Borrower pre-signs future tx templates (e.g., liquidation).
4. Sui emits authorization proofs on valid triggers.
5. MPC co-signs only with Sui authorization.
6. Liquidations or repayments occur directly on native chain.

---

## 4) Loan Lifecycle

**A. Create Offer (Lender)**
- Lender sets collateral, LTV, interest, liquidation bonus.

**B. Open Loan (Borrower)**
- Borrower chooses offer, deposits native collateral into dWallet.
- Sui validates deposit → collateral locked.
- Borrower receives native asset from lender (escrowed or direct).

**C. Repayment**
- Borrower repays principal + interest to dWallet.
- Sui marks loan repaid.

**D. Liquidation**
- If HF < 1.0, Sui authorizes liquidation template.
- dWallet executes native-chain transfer to lender.

---

## 5) Liquidations

- Pre-signed deterministic templates.
- Partial liquidation before full.
- Keeper market executes triggers for small bounty.

---

## 6) Oracles & Risk

- Two oracle feeds: fast + secure medianized.
- Pause liquidations if divergence > threshold.
- Haircuts and LTV caps per asset.
- Collateral: BTC/ETH LTV ~60–70%.
- Liquidation bonus: 5–10%.
- Borrow rate: Kinked utilization curve.

---

## 7) Smart Contract Interfaces (Move)

- `create_offer(terms)`
- `accept_offer(offer_id, params)`
- `register_collateral_deposit(loan_id, proof)`
- `draw(loan_id, amount)`
- `repay(loan_id, amount)`
- `liquidate(loan_id, amount)`
- `close(loan_id)`

---

## 8) Security & Threat Model

**Threats:**
- MPC bypass → mitigated by on-chain policy hash checks.
- Oracle manipulation → dual feeds & TWAP sanity.
- Chain reorgs → require confirmations, grace periods.
- MEV front-running → pre-committed templates reduce exposure.

**Audits:**
- Phase 1: Move logic
- Phase 2: MPC/dWallet code
- Phase 3: Oracle adapter

---

## 9) Economic Model

- **Origination fee:** 0–30 bps.
- **Interest share:** 10–20% to treasury.
- **Liquidation fee:** 1–2% of bonus.
- Incentives for early lenders + keepers.

---

## 10) Governance

- **V0:** Multisig + timelock configs.
- **V1:** Token-weighted votes.
- **V2:** Parameter councils.

---

## 11) UX Flows

**Borrower:**
- Select offer → deposit collateral → draw asset → monitor → repay → withdraw.

**Lender:**
- Create offer → fund → monitor utilization & APR.

**Risk UX:**
- Health factor with latency buffer.
- Liquidation band visualization.

---

## 12) Testnet Plan

- **Collateral:** Bitcoin testnet BTC.
- **Borrow Asset:** Sui testnet USDC.
- **Stretch:** ETH Sepolia collateral.

**Demo Flow:**
- Deposit BTC → Borrow USDC → Price drop → Auto-liquidation → Lender receives BTC.

---

## 13) Milestones

| Milestone | Duration | Success Criteria |
|------------|-----------|------------------|
| Spec & Risk Params | 1–2 wks | Signed spec |
| Move Contracts v0 | 3–4 wks | 90%+ coverage |
| dWallet Integration | 3–5 wks | Collateral & liquidation sim |
| Oracle Integration | 2–3 wks | Correct HF updates |
| Frontend MVP | 2–3 wks | End-to-end flow |
| Relayer & Keepers | 2 wks | SLA-based liquidation |
| Testnet Launch | 2–4 wks | Public test + audit prep |

---

## 14) Design Choices

- **Collateral proof:** Start with attestation network; roadmap SPV.
- **Outflow model:** Escrowed first; direct-outflow later.
- **Liquidation executors:** Open keeper model with cap rewards.

---

## 15) Team Plan

- 1–2 Move Devs (core contracts)
- 1 Crypto Engineer (MPC integration)
- 1 Backend (indexer, relayer)
- 1 Frontend Dev
- 1 QA/SRE
- External auditor

---

## 16) Validation KPIs

| Category | Metric |
|-----------|--------|
| Tech | Liquidation latency, oracle divergence |
| Market | Offer fill time, utilization rate |
| UX | Success rate, tx failure rate |

---

## 17) Next Steps

Produce:
1. **Formal spec** (state machines + diagrams)
2. **Risk parameter table**
3. **Move API stubs**
4. **Testnet runbook**

---

