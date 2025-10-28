# 🔧 Super Prompt — Generate the Complete UI for the **Zero‑Trust Multi‑Chain Lending Protocol**
*Goal:* Produce a **production‑ready, responsive UI** covering **all flows** for the ZT‑MCLP dApp: borrower, lender, keeper, and admin/risk.  
*Deliverable:* Clean, modular code with high‑fidelity UX (mobile/desktop), **state‑complete** (loading/empty/error), and **simulatable testnet demo**.

> **Implementation Preference (adjustable)**: React + TypeScript + Tailwind + shadcn/ui + Zustand (state) + TanStack Query (data) + Recharts (charts).  
> If you choose plain HTML/CSS/JS instead, keep identical structure/flows and implement progressively.

---

## 🧱 Global Requirements (apply to every section)
- **Design System & Tokens**
  - Colors (light theme first; support dark): `primary`, `success`, `warning`, `danger`, `muted`, `bg`, `card`.
  - Spacing scale (4‑pt system), radius (`rounded-2xl` default), shadows (soft).
  - Typography: readable sans for UI; mono for hashes/ids.
  - Breakpoints: `sm 480`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- **Layout**
  - App shell: left nav (collapsible) + top bar (network selector, wallet, notifications) + page content.
  - Mobile: bottom tab bar for primary flows; sticky CTA for critical actions.
- **State Completeness**
  - Loading skeletons, empty states, pagination, error toasts, retry.
  - Disabled states with reasons; permissions gating per role.
- **Interaction UX**
  - Confirmations for on‑chain actions; copyable ids; contextual tooltips.
  - Accessible (WCAG AA): focus states, ARIA labels, keyboard navigation.
- **Network & Env**
  - **Network switcher**: Sui Testnet/Mainnet, BTC Testnet/Mainnet, others.
  - **Testnet demo mode** toggle to prefill flows with sandbox values.
- **i18n & Units**
  - i18n placeholders; number formatting; asset decimals; fiat conversion preview.
- **Security Copy**
  - Clear language for irreversible actions; “no custodial control” disclaimer; oracle latency notices.
- **Telemetry (dev)**
  - Event hooks for important actions (accept offer, register deposit, liquidate).

> **Output Contract**: For each section below, generate: **(A)** Page layout & components, **(B)** Acceptance Criteria, **(C)** API bindings (functions/types), **(D)** Edge cases & tests, **(E)** Sample mock data.

---

## 0) App Boot & Navigation
**Goal:** Consistent shell and routing between flows.
- Pages: `/dashboard`, `/offers`, `/offers/:id`, `/loans`, `/loans/:id`, `/keepers`, `/risk`, `/settings`, `/auth`.
- Top Bar: network selector, wallet connect (Sui + BTC/ETH address book), notifications, user menu.
- Left Nav: Dashboard, Borrow, Lend, Keepers, Risk, Settings, Docs.
- Quick Actions: “Create Offer”, “Accept Offer”, “Simulate Liquidation”.

**Acceptance Criteria**
- Shell persists across routes; skeleton while loading root data.
- Nav reflects user role context (borrower/lender/keeper).

---

## 1) Authentication & Wallet Connection (Multi‑Chain)
**User Stories**
- As a user, I connect **Sui** wallet (primary) and add **external chain** addresses (BTC, ETH, etc.).
- As a user, I can switch networks (Testnet/Mainnet) and see warnings.

**UI Requirements**
- Connect modal: Sui wallet + address book form (BTC/SOL/ETH).
- Address verification (optional message sign) + label.
- Network banner (testnet warning), chain status pill (oracle freshness).

**API Bindings**
- `connectSui()`, `disconnectSui()`
- `saveExternalAddress({ chain, address, label })`
- `getNetworkStatus()`

**Edge Cases**
- Unsupported wallet; address format invalid; network mismatch; stale oracle.

---

## 2) Offers — Browse & Discovery (Borrower)
**User Stories**
- See list of active **Offers** with filters (asset, LTV, rate, duration, capacity).
- Inspect an Offer’s **terms, assets, risk**, and **lender reputation**.

**UI Requirements**
- Table + cards view; sorting; quick view drawer.
- KPIs: Max LTV, LT, Rate model, Liq bonus, Min conf, Capacity left.
- CTA: **Accept Offer**.

**API Bindings**
- `listOffers(filter)` → `OfferRow[]`
- `getOffer(id)` → `OfferDetail`

**Edge Cases**
- No offers; paused/exhausted offers; extreme params highlight (warning).

---

## 3) Offer Creation & Management (Lender)
**User Stories**
- Create, pause/resume, cancel, and update Offers; see matches & utilization.

**UI Requirements**
- Multi‑step form: accepted collateral set, borrow assets, rate model (kink UI), capacity, outflow model (Escrowed/Direct), payout routes.
- Review screen with **on‑chain fee estimation**.
- Offer detail page: status timeline, matches, revenue, utilization chart.

**API Bindings**
- `createOffer(params)`, `pauseOffer(id)`, `resumeOffer(id)`, `cancelOffer(id)`
- `getOfferMatches(id)`

**Edge Cases**
- Capacity zero → Exhausted; unsafe params → risk linter warnings.

---

## 4) Accept Offer & Loan Creation (Borrower)
**User Stories**
- Accept an offer, configure **Loan** params (LTV within max), and instantiate loan.
- Receive **dWallet deposit address** for collateral.

**UI Requirements**
- Review terms; slider for initial draw; select collateral chain.
- Success panel shows: `LoanID`, `PolicyHash`, `BTC dWallet address`, QR code, copy.
- “Open in block explorer” links.

**API Bindings**
- `acceptOffer(offerId, cfg, collateralSpec, debtSpec)` → `{ loan, policy, fttLiq }`

**Edge Cases**
- Offer paused during flow; chain unsupported; address book missing.

---

## 5) Collateral Deposit & Registration
**User Stories**
- Send BTC/ETH to **dWallet** address; app tracks confirmations; register proof on Sui.

**UI Requirements**
- Deposit tracker: mempool → conf progress → “Register on Sui” button.
- Validation card shows min conf (`conf_min`) and amount.
- After registration → **Collateral Locked** badge; state changes to **Active**.

**API Bindings**
- `watchDeposit({ chain, address })` → `TxStatus`
- `registerCollateralDeposit(loanId, proofJson, amount, txid, conf)`

**Edge Cases**
- Wrong amount; insufficient confirmations; proof mismatch; reorgs.

---

## 6) Loan Dashboard (Positions & Health)
**User Stories**
- View all my loans (borrower/lender), **Health Factor (HF)**, oracle freshness, and actions.

**UI Requirements**
- Positions table with **HF bar**, utilization chart, interest accrual, next steps (repay/draw/close).
- Detail page: chronology (events), accounting (principal, interest), FTT templates list (hashes), policy hash, addresses.

**API Bindings**
- `listLoans(role)` → `LoanRow[]`
- `getLoan(id)` → `LoanDetail`
- `getEvents(loanId)` → `Event[]`

**Edge Cases**
- Stale oracle → show “paused liquidations” banner; pagination for long history.

---

## 7) Draw Borrow Asset
**User Stories**
- Draw down borrow asset (escrowed or direct‑outflow model).

**UI Requirements**
- Amount input with limits; fee estimate; post‑draw HF preview.
- Confirmation modal with **irreversibility** copy.

**API Bindings**
- `draw(loanId, amount)`

**Edge Cases**
- Amount exceeds available; insufficient escrow; rate model change mid‑flow.

---

## 8) Repayment (Partial & Full)
**User Stories**
- Repay partially or fully; preview interest; see resulting HF.

**UI Requirements**
- Amount input; source chain selector; receive address (if direct to lender) preview.
- Success panel with **receipt** and updated accounting.

**API Bindings**
- `repay(loanId, amount, chain)`
- `repayFull(loanId)`

**Edge Cases**
- Overpayment; wrong chain; network outage; fee spike warning.

---

## 9) Liquidation Simulator (UX + Risk Education)
**User Stories**
- Simulate price moves to see **HF** and liquidation thresholds before it happens.

**UI Requirements**
- Price slider, latency multiplier (`λ`) toggle, haircut toggles.
- Charts: HF vs Price; Liq band; partial liquidation steps.

**API Bindings**
- `simulateHF({ prices, haircuts, lt, debt, collateral })`

**Edge Cases**
- Divergent oracle sources; stale price; min/max slider bounds.

---

## 10) Liquidation Execution (Keeper/Lender)
**User Stories**
- When HF < 1.0, trigger liquidation with **Sui authorization** and execute native chain transfer.

**UI Requirements**
- “Eligible for liquidation” list; detail with `FTTID`, bounds, deadline.
- CTA “Execute Liquidation” → MPC endpoint → status log (signing, broadcast, conf).

**API Bindings**
- `checkHealth(loanId)` → `{ hfBps, round }`
- `liquidate(loanId, maxRepay, fttId)`
- `postReceipt(loanId, txid)` (optional)

**Edge Cases**
- Policy hash mismatch; replay attempt; deadline passed; insufficient proceeds.

---

## 11) Withdraw Collateral (Post‑Repay)
**User Stories**
- After full repayment, authorize **withdraw** FTT and receive native collateral back.

**UI Requirements**
- Withdraw wizard: destination address selector; network fee tip.
- Success with explorer links; state → **Closed**.

**API Bindings**
- `authorizeWithdrawal(loanId, fttWithdrawId)`

**Edge Cases**
- Wrong address; expired FTT; chain congestion; partial dust amount.

---

## 12) Lender Console (Revenue & Risk)
**User Stories**
- Monitor matched loans, earnings, utilization; adjust offer params; manage liquidity.

**UI Requirements**
- Cards: Active Offers, Matched Loans, APR realized, Liquidations received.
- Charts: revenue over time; utilization per offer.
- Actions: pause/resume/cancel; update terms (safe subsets only).

**API Bindings**
- `getOfferRevenue(offerId)`, `getUtilization(offerId)`, `updateOffer(paramsSubset)`

**Edge Cases**
- Backwards‑incompatible updates disallowed; pause lag; exhausted capacity.

---

## 13) Keeper Console (Tasks & Bounties)
**User Stories**
- See liquidation candidates, bounties, and SLA; run “auto‑liquidate” loop.

**UI Requirements**
- Task queue list; filters by chain/asset/HF; batch execute.
- SLA chart: breach → tx inclusion latency.

**API Bindings**
- `listLiquidationCandidates()`, `executeTask(taskId)`

**Edge Cases**
- Same candidate picked by many; race conditions; fee estimation failure.

---

## 14) Risk & Governance
**User Stories**
- View risk table; oracle status; propose parameter updates (timelocked).

**UI Requirements**
- Risk params table (per asset/chain); edit form (admin only).
- Oracle feed status (freshness, divergence); pause markets toggle (timelocked).

**API Bindings**
- `getRiskParams()`, `setRiskParams(...)` (admin), `getOracleStatus()`

**Edge Cases**
- Timelock pending; conflicting proposals; halted markets messaging.

---

## 15) Notifications & Activity
**User Stories**
- Get alerts for conf complete, HF low, liquidation triggered/executed, repayment cleared.

**UI Requirements**
- In‑app bell + feed; email/webhook toggles.
- Fine‑grained preferences per loan/offer.

**API Bindings**
- `subscribe(event, channel)`, `listNotifications()`, `markRead(id)`

**Edge Cases**
- Rate limits; duplicate events; missing permissions.

---

## 16) Settings & Developer Tools
**User Stories**
- API keys for relayer/keeper; webhooks; export artifacts; theme toggle; testnet mode.

**UI Requirements**
- Tabs: Profile, API Keys, Webhooks, Addresses, Theme, Advanced.
- Export buttons: `publish.out.json`, `risk_params.json`, `policy.json`, logs.

**API Bindings**
- `createApiKey()`, `revokeApiKey()`, `setWebhook(url)`

**Edge Cases**
- Key leakage warning; invalid webhook; non‑HTTPS disallowed in prod.

---

## 17) Error Pages & Empty States
- 404, 500, maintenance page; “No offers yet”, “No loans yet”, “No candidates to liquidate” with **guided CTAs**.

---

## 18) Accessibility & Internationalization
- Keyboard traps tested; dark mode contrast; language switcher placeholder; currency formatter; RTL readiness.

---

## 19) Testing & Storybook
- Storybook stories for every component state; snapshot tests for pages; Playwright e2e for critical flows (accept, deposit, draw, liquidate, repay, withdraw).

---

## 20) Data Types — Example (TypeScript)
```ts
type ChainId = 'SUI' | 'BTC' | 'ETH' | 'SOL' | 'BNB';
type Address = string;

interface OfferRow { id: string; assets: string[]; maxLtvBps: number; ltBps: number; rateModel: string; capacity: number; status: 'Active'|'Paused'|'Exhausted'|'Cancelled'; }
interface OfferDetail extends OfferRow { outflowModel: 'Escrowed'|'Direct'; payoutRoutes: Record<ChainId, Address>; createdAt: number; }

interface LoanRow { id: string; role: 'Borrower'|'Lender'; hfBps: number; debtAsset: string; collateralAsset: string; state: string; updatedAt: number; }
interface LoanDetail extends LoanRow { policyHash: string; fttIds: string[]; events: Array<any>; accounting: { principal: string; interestIndexBps: number; lastAccrueAt: number; }; }

interface TxStatus { txid: string; confirmations: number; required: number; status: 'mempool'|'pending'|'confirmed'|'reorg'; }
```

---

## 21) Output Instructions for the LLM
- Generate a **monorepo** structure:
  - `/apps/web` (Next.js or Vite React app)  
  - `/packages/ui` (shared shadcn/ui components, Tailwind preset)  
  - `/packages/types` (shared TS types)  
  - `/packages/mocks` (mock services & fixtures)  
- Each page must be **runnable with mocks** (`DEV_USE_MOCKS=1`) and **switchable to real APIs**.
- Provide **seed scripts** to populate example offers/loans and to **simulate price updates**.
- Include **README** with setup steps, env vars, and **demo script** to reproduce the full flow.

---

## 22) Acceptance Criteria (Global Definition of Done)
- All flows in sections **0–16** implemented with **complete states (loading/empty/error)**.
- Works on mobile (375px) and desktop (1440px); no layout overflows.
- Network switcher + testnet mode functional across app.
- Liquidation simulator accurate vs formula in spec.
- Type‑safe APIs and shared types across app.
- Storybook coverage for critical components; e2e script passes locally.

---

## 23) Sample Mock Dataset (Seed)
- 6 Offers (BTC/SUI/ETH/SOL/BNB pairs) with varied params.
- 3 Loans (1 Active with HF 1.2, 1 Pending Liquidation HF 0.85, 1 Repaid).
- 4 Liquidation candidates across assets with different deadlines and bounties.
- Oracle status with one source stale → trigger banner.

---

### Final Instruction
**Produce the full UI codebase** according to the sections above. Where a backend is needed, **stub an API layer** with typed functions and mock data. Ensure every action has **user feedback**, all ids are **copyable**, and security‑sensitive actions include **clear warnings**. Provide installation steps and a **single `npm run demo`** to walk through: *connect → browse offers → accept → deposit (mock) → register → draw → price drop → liquidate → repay → withdraw*.
