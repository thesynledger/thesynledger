# Zero-Trust Multi-Chain Lending — Technical & Product Blueprint

## 1) Core Principles (crystallized)
- **Native-in / native-out:** No wrapping or custodians. Collateral and borrows stay on their home chains.
- **Smart-contract enforced (Sui):** All terms/rights are encoded in Sui Move modules; no human/operator discretion.
- **Keyless & zero-trust custody:** dWallets (Ika 2PC-MPC) hold collateral across chains; Sui contracts gate every action.
- **P2P loans:** Borrower ↔ Lender bilateral terms; privacy of counterparties is preserved while terms are on-chain.
- **Deterministic liquidations:** Triggerable by lenders (or keepers) when oracle conditions are met, via pre-authorized future transactions.

---

## 2) High-Level Architecture

**On Sui:**
- **Lending Core (Move):** Markets, positions, collateral factors, interest model, liquidation logic, roleless execution.
- **Vault Controller:** Manages loan state and creates/owns **dWallet controllers** per loan.
- **Oracle Adapter(s):** Pluggable; normalizes cross-chain feeds into a canonical USD (or quote) for risk checks.
- **Fee & Treasury Module:** Protocol fees, referral splits, safety module.

**Off/Sui—per external chain (BTC, ETH, …):**
- **dWallets:** Threshold-controlled accounts whose signing policy is anchored in the Sui contract (2PC-MPC).
- **Execution Relayer(s):** Stateless services that submit Sui-authorized bundles (e.g., liquidation tx) to L1s.
- **Liquidation/Health Keepers (optional):** Watch positions, simulate health, and call liquidation endpoints.

**Front-End (reference app):**
- Cross-chain position dashboard, health factor, borrow/repay/deposit/withdraw flows, signatures handled via Sui wallet + dWallet UX.

**Data Plane:**
- Indexers for Sui events + external chain txs (subgraph equivalent or custom indexer) to build canonical position state for UX/analytics.

---

## 3) The dWallet + 2PC-MPC Control Pattern (how zero-trust is enforced)

**Goal:** Ensure **no one** can move collateral except through the Sui loan contract’s rules.

**Mechanics:**
1. **Loan Instantiation:** Sui contract creates a **Loan Object** and binds it to a fresh **dWallet** per collateral chain.
2. **Policy Embedding:** The dWallet’s signing policy references the Loan Object ID + state machine (e.g., “only allow these pre-shaped transactions under these conditions”).
3. **Future Transactions:**  
   - At loan open, the Borrower pre-signs (or pre-authorizes) specific **future tx templates** (e.g., liquidation transfers to lender) parameterized by price and time bounds.
   - The Sui contract stores hashes/commitments of these templates.
4. **2PC-MPC:** When a valid state transition occurs (e.g., liquidation threshold breached per oracle), Sui emits **authorization proofs** that allow the dWallet to complete the corresponding future tx on the collateral’s chain.  
   - The MPC network co-signs **iff** the Sui contract emitted the authorization for the exact template.
5. **Net Effect:** Liquidations or repayments can be executed **directly on the native chain** without any custodian, using policy-guarded MPC signatures triggered by Sui.

---

## 4) Loan Lifecycle (step-by-step)

**A. Create Offer (Lender)**
- Lender specifies: accepted collateral (e.g., BTC), LTV, interest model, max duration, liquidation bonus, accepted borrow asset(s).
- Offer is posted on Sui as an object; optionally private matching off-chain → commit on-chain.

**B. Open Loan (Borrower)**
- Borrower selects an offer, posts collateral:
  - Sui creates **BTC-dWallet** (for example).
  - UI generates a deposit address = the dWallet address. Borrower deposits BTC there.
  - Sui confirms deposit via SPV-like proof or trusted light-client/attestation pipeline (design choice), then marks **collateral_locked**.
- Borrower borrows native asset on another chain (e.g., lender funds **ETH-dWallet** controlled by the same Sui loan or sends ETH directly to borrower’s EOA as per offer; two variants below).

**C. Two funding patterns (choose one per market):**
1. **Escrowed-Outflow:** Lender pre-funds the **borrow-asset dWallet**; borrower “draws down” under Sui rules.  
2. **Direct-Outflow:** Lender transfers the borrow asset directly to borrower upon Sui **draw authorization**.

**D. Accrual & Maintenance**
- Interest accrues per block/slot on Sui (canonical), with periodic reconciliation on external chains when repayments occur.

**E. Repayment**
- Borrower repays into the borrow-asset dWallet or directly to lender EOA (based on policy). Sui marks principal+interest paid.

**F. Withdrawal**
- On full repayment + fees, Sui emits authorization for the BTC-dWallet to send collateral back to borrower’s address.

**G. Liquidation**
- If **HF < 1.00** (per oracle), lender (or keeper) calls **liquidate()** on Sui.  
- Sui verifies breach → emits signed-policy authorization → dWallet executes **pre-signed** liquidation transfer **directly** on the native chain to lender’s address (up to the required amount with bonus), and unlocks state accordingly.

---

## 5) Liquidations (design details)

- **Deterministic templates:** Pre-commit exact transfer format (asset, chain, lender address, min/max amount, valid window).
- **Partial liquidation first:** Improve user survival and limit slippage/MEV exposure.
- **Keeper market:** Anyone can submit liquidation if they can show HF<1 based on oracle consensus; policy allows a fee.

---

## 6) Oracles & Risk

**Oracle stack (prefer two+ sources):**
- Primary: fast, high-update oracle (e.g., push-based) normalized on Sui.
- Secondary: slower/secure feed (e.g., TWAP/medianized) used as a sanity check.
- Fast-fail if sources diverge beyond tolerance; pause liquidations until convergence (or apply conservative haircuts).

**Key risk knobs:**
- **Collateral Factors (LTV/HLTV):** Conservatively low at launch for BTC/ETH (e.g., 60–70% LTV).
- **Liquidation Incentives:** 5–10% bonus initially.
- **Borrow Rate Model:** Kinked utilization curve per market; floor rate for capital stickiness.
- **Volatility Haircuts:** Per-asset + chain-specific (reorg risk, fee spikes, congestion).
- **Cross-chain Latency:** Add penalty buffers to thresholds to account for confirmation lag.

---

## 7) Smart-Contract Interfaces (Move, high-level)

- `create_offer(terms) -> OfferObject`
- `accept_offer(offer_id, collateral_chain, params) -> LoanObject`
- `register_collateral_deposit(loan_id, proof)`  
- `draw(loan_id, amount)`  
- `repay(loan_id, amount)`  
- `liquidate(loan_id, max_repay)`  
- `close(loan_id)`  
- Adminless controls: pausability only via Safety Module multisig + time-lock (no privileged fund movement).

---

## 8) Security & Threat Model

**Primary threats & mitigations**
- **MPC/dWallet policy bypass:** Use on-chain attestations from Sui as the only gate to MPC co-sign; publish policy hashes; audit MPC codepaths.
- **Oracle manipulation / latency:** Dual-feeds, sanity checks, TWAP bounds, circuit-breakers, per-asset caps on daily liquidation volume.
- **Reorgs / chain halts:** Require N-conf for collateral deposits; back-off logic and grace periods; allow **pending liquidation** state until finality.
- **Relayer key risk:** Relayers are stateless; no custody. All power is from Sui authorizations + dWallet policy.
- **Front-running/MEV on liquidations:** Pre-committed templates reduce scope; use exact-amount transfers and caps.

**Audits**
- Phase 1: Move modules (state machine, offers, liquidations).  
- Phase 2: dWallet policy + MPC verification path.  
- Phase 3: Oracle adapter & market math.

---

## 9) Economic Model (initial)

- **Fees:**
  - **Origination:** 0–30 bps to protocol treasury.
  - **Ongoing spread:** % of interest (e.g., 10–20% of interest to protocol safety fund).
  - **Liquidation fee:** Portion of bonus (e.g., 1–2%) to treasury.
- **Incentives:**
  - Early lender incentives (boosted yield via fee rebates).
  - Keeper incentives (fixed bounty from liquidation bonus).
- **Treasury/Safety:**
  - Fee stream to Safety Module; used to backstop shortfalls or fund buybacks.

---

## 10) Governance (gradual decentralization)

- **V0:** Multisig + timelock for config params (caps, LTVs, oracle sets).
- **V1:** Token-weighted/ve-style voting for market listings, LTV changes, and fee splits.
- **V2:** On-chain parameter councils (risk committee elections).

---

## 11) UX & Flows (reference app)

**Borrower**
- Select offer → deposit native collateral → confirm lock on Sui → draw borrow asset → track health factor → repay → withdraw.

**Lender**
- Create offers → fund liquidity (escrowed or direct-outflow) → monitor utilization & APR → auto-compound interest receipts.

**Risk/Clarity UX**
- Health Factor with latency buffer messaging (“includes X-block confirmation lag”).
- Clear visualization of liquidation bands and pending authorizations.
- Chain-specific gas & confirmation ETA hints.

---

## 12) Testnet Plan (as requested)

**Pairs at launch:**  
- **Collateral:** Bitcoin testnet (tBTC).  
- **Borrow Asset:** Sui testnet USDC (or native stable).  
- **Stretch:** Add ETH Sepolia collateral and borrow Sui or ETH testnet asset.

**What to demo**
- End-to-end: BTC deposit → borrow Sui USDC → price falls (oracle) → liquidation tx executes on Bitcoin testnet dWallet to lender.
- Repayment & unlock cycle.

---

## 13) Milestones & Estimates (build-ready)

1) **Spec & Risk Parameters (1–2 wks)**
- Formal state machines, policy templates, oracle SLA, LTV tables.
- **Success:** Signed spec; threat model doc.

2) **Move Contracts v0 (3–4 wks)**
- Offers, loans, health math, events, fee module, oracle adapter interface.
- **Success:** Unit tests >90% lines; property tests for invariants.

3) **dWallet Integration v0 (3–5 wks)**
- Policy binding to Loan Object; future-tx template commitment; 2PC-MPC glue.
- **Success:** Golden-path deposit/withdraw + simulated liquidation on a devnet.

4) **Oracle Integration (2–3 wks)**
- Two feeds + sanity checks, halt logic.
- **Success:** HF correctness across stress vectors.

5) **Frontend MVP (2–3 wks)**
- Collateral deposit, borrow, repay, health, liquidation simulator.
- **Success:** Non-engineer can run full flow on testnet.

6) **Relayer & Keeper Services (2 wks)**
- Stateless relayer, keeper bots, alerting.
- **Success:** Auto-liquidation within SLA after breach.

7) **Testnet Launch + Audit Prep (2–4 wks)**
- Public test, bug bash, freeze for audit.
- **Deliverables:** Audit scope, artifacts, runbooks.

*(Several tracks can run in parallel; end-to-end testnet is feasible in ~10–14 weeks with a lean team.)*

---

## 14) Open Design Choices (recommendations)

- **Collateral verification:**  
  - **Option A:** Light-client/SPV proofs verified on Sui (trust-minimized, more engineering).  
  - **Option B:** Attestation network / oracle reports of balances (faster to ship; add haircuts).
  - *Rec:* Start with B + conservative LTV; roadmap A.

- **Borrow outflow model:**  
  - **Escrowed-Outflow** simplifies drawdowns and guarantees availability; slightly more capital inefficiency for lenders.  
  - **Direct-Outflow** is capital-efficient but requires lender online at draw.  
  - *Rec:* Start Escrowed-Outflow for smooth UX.

- **Liquidation executor set:**  
  - Open to all keepers vs allow-list at v0.  
  - *Rec:* Open with capped rewards; anti-spam safeguards.

---

## 15) Engineering Work Plan (team & roles)

- **Move Engineer (1–2):** Core lending & oracle adapters.
- **Crypto/Protocol Engineer (1):** dWallet/MPC policy + cross-chain templates.
- **Backend (1):** Indexer, relayer, keeper services, APIs.
- **Frontend (1):** Reference dApp.
- **QA/SRE (fractional):** Test harness, monitoring, runbooks.
- **Security (external):** Auditor(s) booked by spec freeze.

---

## 16) Validation KPIs

- **Tech:** Liquidation execution time (breach→on-chain tx) per chain; oracle divergence incidents; invariant test coverage.
- **Market:** Time-to-fill offers; utilization rate; default/loss rate; spread vs comparable lending venues.
- **UX:** Borrower success rate; avg steps to complete flow; failed tx %.

---

## 17) Next Steps I can deliver now
- Convert the above into:  
  1) **Formal spec** (state machines + sequence diagrams),  
  2) **Risk parameter table** (per asset/chain),  
  3) **API/ABI stubs** for Move modules & relayer,  
  4) **Testnet runbook** (scripts + “how to demo” checklist).

If you want, I’ll draft those immediately in raw, copy-pastable Markdown.
