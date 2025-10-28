
# 🎨 LLM Prompt — Design the UI for **Account Marketplace**
**Goal:** Produce a complete, production-ready UI/UX spec (wireframes + component library + states + copy) for a **light-theme**, fintech-clean marketplace that enables **zero-trust transfer of entire accounts** using dWallet resharing on Sui.

> **Style & Brand:** Light theme, minimal, high-contrast, accessible. Primary color **Electric Blue `#007AFF`**, neutral grays, generous white space, rounded corners (lg), soft shadows, Inter/Poppins type. Tone = confident, transparent, trustworthy.

> **Deliverables the LLM must output:**  
> 1) A structured **Figma-ready description** of pages, frames, and components (names, constraints, breakpoints).  
> 2) UI copy (headlines, helper text, tooltips, empty states, error messages) in **EN-US**.  
> 3) All **states** (default, hover, active, loading, success, error, disabled).  
> 4) **Edge cases**, **empty states**, **validation rules**, **accessibility** specs (WCAG 2.1 AA), keyboard flows.  
> 5) **Design tokens** (colors, spacing, radii, typography scale, elevations).  
> 6) **Responsive specs** (Mobile 375, Tablet 768, Desktop 1440).  
> 7) **Information Architecture** diagram (textual tree) + **User Flow** diagrams (text).  
> 8) **Component API** for each atom/molecule (props, variants, usage guidance).  
> 9) **Content model** for listings/bids/accounts (sample JSON + UI bindings).  
> 10) **Acceptance Criteria** checklists for each flow.  

---

## 0) Global Foundations
- **Design tokens:**
  - Colors: `primary = #007AFF`, `primary-600 = #0060D6`, `success = #16A34A`, `warning = #F59E0B`, `error = #DC2626`, neutrals `#111`, `#222`, `#6B7280`, `#F3F4F6`, `#FFFFFF`.
  - Radii: `4, 8, 12, 16` (default `12`), Elevation: `sm, md, lg`.
  - Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
  - Typography: Inter/Poppins — headings (32/24/20/18), body (16/14), label (12).
- **Grid & Layout:** 12-col desktop (1440), 8-col tablet (768), 4-col mobile (375). Safe areas respected.
- **Iconography:** Lucide/Feather-style line icons; consistent stroke; no skeuomorphism.
- **Accessibility:** WCAG 2.1 AA contrast, focus outlines, skip links, keyboard nav, semantic landmarks.
- **Security UX:** surfacing attestation, coordinator signatures, deadlines, and refund safeguards with clear copy.

---

## 1) Auth & Onboarding Flow
**Objective:** Connect wallet (Sui), optional email passkey, optional **KYC** for verified trading.

**Frames & Screens:**
- `Auth/Welcome`
- `Auth/ConnectWallet`
- `Auth/KYC-Start` → `Auth/KYC-Upload` → `Auth/KYC-Review`
- `Auth/Success` & `Auth/Rejected`
- `Auth/Recovery` (explain dWallet resharing conceptually; no private keys exposed)

**Components:**
- WalletConnect modal, Provider list, Status toasts, KYC progress steps, Document uploader, Consent checkbox.

**Copy Snippets:**
- Hero: “Sign in and verify to list or buy entire accounts.”
- Helper: “Verification is optional but unlocks higher limits and reduced fees.”

**Edge Cases:** Wallet not installed, KYC timeout, network mismatch, partial verification.

**Acceptance Criteria:**
- Keyboard-friendly, context-aware errors, retry & fallback, saved progress.

---

## 2) Discovery, Search & Browse
**Objective:** Help users **find accounts** (veTokens, SBTs, gaming, “airdrop farmer” wallets) with confidence.

**Frames:**
- `Home/Discover`, `Search/Results`, `Listing/Category`, `Account/Preview`.

**Filters & Sort:**
- Asset type, chain(s), valuation band, verified status, royalty policy, resale allowed, cooldown, time listed, price.

**Card Layout:**
- Avatar (account identicon), tags (SBT, veCRV, Game), `valuation_score`, `confidence`, quick provenance count, price/auction status.

**Empty States:** “No matches. Try relaxing filters or explore curated collections.”

**Acceptance Criteria:** Instant feedback, readable at-a-glance risk/valuation, loading skeletons.

---

## 3) Listing Creation (Seller)
**Objective:** Allow seller to list an **AccountHandle** with price or auction and **transfer policy**.

**Screens:**
- `Listing/New/Intro`
- `Listing/New/AccountHandle-Select` (connect dWallet pointer)
- `Listing/New/Pricing` (fixed price or auction params)
- `Listing/New/Policy` (resale_allowed, cooldown, buyer_class, royalty_bps)
- `Listing/New/Review & Publish`
- `Listing/Success`

**Validation:**
- Ensure handle ownership, policy constraints, reserve price < buy-now, deadline reasonable.

**Copy:**
- “Policy controls how your account can be resold. Choose wisely.”

**Acceptance Criteria:** Clear fee preview, policy summary chips, publish confirmation with tx id.

---

## 4) Bidding & Offers
**Objective:** Support **fixed price**, **English auction**, and **make-offer** flows.

**Screens:**
- `Listing/Detail` with tabs: Overview, Holdings, Valuation, Provenance, Policy, Activity.
- `Bid/Place`, `Offer/Make`, `Offer/Manage`.

**Components:**
- Bid input (min increment), time remaining, anti-sniping rule notice, offer table, “Accept/Reject” modals.

**Edge Cases:** Outbid notifications, cancelled listing, reserve not met, gas failure.

**Acceptance Criteria:** Bid progress feedback, error recovery, clear refund rules in UI.

---

## 5) Purchase & Escrow Commit
**Objective:** Allow buyer to **commit funds** and start dWallet **reshare** ceremony.

**Screens:**
- `Purchase/Commit` (payment method, fees, deadline)
- `Purchase/Confirm` (summary + attestation reminder)
- `Purchase/Processing` (progress indicators)
- `Purchase/Result` (Settled/Refunded)

**UX Requirements:**
- Prominent deadline countdown, coordinator identity, “What happens if timeout?” explainer.

**Acceptance Criteria:** Funds escrowed visibly, buyer sees refund path, audit trail event list.

---

## 6) Reshare Ceremony Status
**Objective:** Visualize dWallet **resharing**: Seller → Buyer, with **attestation** posted.

**Screens:**
- `Reshare/Timeline` (events: Started → In-progress → Attested → Settled)
- `Reshare/Seller-Checklist` (confirmations)
- `Reshare/Buyer-Checklist`

**Components:** Stepper, status badges, attestation block (coordinator, signatures, expiry, nonce).

**Acceptance Criteria:** Real-time updates (polling/websocket), final receipt + provenance update.

---

## 7) Provenance, Policy & Compliance
**Objective:** Make **chain-of-custody** and **eligibility** transparent.

**Screens:**
- `Account/Provenance` (ownership history, tx links)
- `Account/Policy` (resale rules, cooldown, royalty receivers)
- `Account/Compliance` (KYC badges, “clean hands” proofs)

**Edge Cases:** Private provenance (seller opt-out), region lock, ZK-eligibility (future).

**Acceptance Criteria:** Clear visual distinction between verified/unverified data; tooltips linking to docs.

---

## 8) Valuation & Holdings
**Objective:** Explain **valuation score** and holdings at a glance.

**Screens:**
- `Account/Holdings` (assets table)
- `Account/Valuation` (score, confidence, factors: TVL, age, reputation tags)
- `Account/Risk` (anomalies, flags)

**Components:** Donut/line charts (system default colors), factor badges (e.g., “Early Airdrops”, “veToken 24m lock”).

**Acceptance Criteria:** Show inputs → outputs; human-readable explanations; disclaimers.

---

## 9) Portfolio & Dashboard
**Objective:** Seller and buyer **dashboards** for activity, balances, payouts, cool-downs.

**Screens:**
- `Dashboard/Overview`
- `Dashboard/Listings`
- `Dashboard/Bids & Offers`
- `Dashboard/Transfers`
- `Dashboard/Settings`

**Widgets:** GMV, fees saved, loyalty points, notifications center, API keys (for devs).

**Acceptance Criteria:** One-click to resume any in-progress flow; export CSV; clear statuses.

---

## 10) Notifications & Comms
**Objective:** Keep users informed (bids, outbids, reshare start, attested, settled, refunds).

**Channels:** In-app, email (opt-in), webhooks for pros.

**Acceptance Criteria:** Rate-limited, digest mode, granular preferences.

---

## 11) Developer Pages (SDK/API)
**Objective:** Drive integrations and ecosystem growth.

**Screens:**
- `Developers/Overview`, `Developers/SDK`, `Developers/API`, `Developers/Webhooks`, `Developers/Sandbox`

**Content:** Quickstarts, code snippets (TS), API keys, example payloads for attestation events.

**Acceptance Criteria:** Copy-pasteable examples; error catalog; test fixtures download.

---

## 12) Settings & Account
**Objective:** Manage identity, security, payouts, and region settings.

**Screens:**
- `Settings/Profile`, `Settings/Security`, `Settings/Verification`, `Settings/Payouts`, `Settings/Region`

**Components:** 2FA, session manager, connected wallets, payout address book, delete/export data.

**Acceptance Criteria:** Clear risk copy; confirmations; data export (JSON).

---

## 13) Error, Empty & Loading States
- **Error:** Actionable, polite, with retry and support links.
- **Empty:** Friendly guidance, sample demos.
- **Loading:** Skeletons, progress bars, background sync notices.

**Acceptance Criteria:** Every critical screen has all three states documented.

---

## 14) Localization & Legal
- **I18N:** Keys prepared, date/time/number formats, RTL-ready.
- **Legal UX:** Terms consent, policy summaries, royalties disclaimer, risk warnings.

**Acceptance Criteria:** Translation fallbacks; shallow legal summaries with “learn more”.

---

## 15) Component Library (Atoms → Molecules → Organisms)
- **Atoms:** Button, Input, Select, Checkbox, Radio, Tag, Tooltip, Toast, Badge, Spinner, Progress, Avatar, Identicon, Price, Countdown, Copy-to-clipboard.
- **Molecules:** Card (ListingCard, BidCard), Table (responsive), Modal (Confirm, KYC), Stepper, Tabs, Pagination, FilterBar, SearchBar.
- **Organisms:** ListingForm, BidPanel, PurchaseCommitPanel, ReshareTimeline, ProvenanceView, ValuationView, NotificationsPanel.

**Component API Spec (example):**
```ts
<ListingCard
  title: string
  accountId: string
  tags: string[]
  valuation: { score: number; confidence: 'low'|'med'|'high' }
  price?: string
  auction?: { currentBid: string; endsAtISO: string }
  provenanceCount: number
  verified: boolean
  onClick: () => void
/>
```

---

## 16) Content Models (Sample JSON)
```json
{
  "listingId": "0xabc...",
  "accountId": "acc_123",
  "title": "veCRV 24m lock — Premium",
  "valuation": { "score": 86, "confidence": "high" },
  "policy": { "resaleAllowed": true, "cooldownMs": 604800000, "royaltyBps": 100 },
  "price": "12,500 USDC",
  "auction": null,
  "provenanceCount": 3,
  "tags": ["veToken", "KYC", "Clean"],
  "status": "LISTED"
}
```

---

## 17) Information Architecture (Text Tree)
```
Home
 ├─ Discover
 │   ├─ Categories
 │   └─ Search Results
 ├─ Listing Detail
 │   ├─ Overview
 │   ├─ Holdings
 │   ├─ Valuation
 │   ├─ Provenance
 │   ├─ Policy
 │   └─ Activity
 ├─ Create Listing
 ├─ Bids & Offers
 ├─ Purchase Commit
 ├─ Reshare Status
 ├─ Dashboard
 │   ├─ Listings
 │   ├─ Bids & Offers
 │   ├─ Transfers
 │   └─ Settings
 └─ Developers
     ├─ SDK
     ├─ API
     └─ Webhooks
```

---

## 18) Acceptance Criteria (Per Flow — Summaries)
- **Auth:** wallet connect works, KYC optional, all errors actionable, mobile ready.
- **Listing:** seller can publish with policy summary + fee preview; validation blocking.
- **Bidding:** bid increments enforced; outbid notifications; refunds explained.
- **Purchase:** escrow commit + clear deadlines; audit trail visible.
- **Reshare:** real-time status; attestation details signed by registered coordinator.
- **Provenance:** ownership changes append-only; link to chain explorers.
- **Valuation:** score + confidence + explanation; disclaimers included.
- **Dashboard:** in-progress flows resumable; CSV export; notifications consolidated.
- **Developers:** working quickstarts; sandbox test keys; example payloads.
- **Accessibility:** keyboard paths, visible focus, color contrast ≥ AA.

---

## 19) Output Format Requirements (from the LLM)
- Paginated **Figma frame list** with hierarchy and names for copy-paste.
- Markdown tables for **component APIs** and **token scales**.
- All **copy** provided inline; separate section for “strings.json” export.
- Include **test IDs** for critical elements (e.g., `data-testid="place-bid"`).
- Provide a **single ZIP-ready structure** outline for a design handoff.

---

## 20) Final Checklist
- [ ] Light theme polished with tokens and spacing scale
- [ ] All flows covered with states (auth → reshare → settlement)
- [ ] Discovery and valuation clarity for illiquid accounts
- [ ] Provenance & policy transparency
- [ ] Error, empty, loading, and accessibility defined
- [ ] Dev docs pages for SDK/API
- [ ] Responsive specs for 3 breakpoints
- [ ] Acceptance criteria met with edge cases

---

**Instruction to the LLM:** Using the above sections, generate the full UI/UX specification, with structured headings so a designer can translate directly into Figma and engineers can build against it. Keep tone concise and instructive. Do not use dark mode.
