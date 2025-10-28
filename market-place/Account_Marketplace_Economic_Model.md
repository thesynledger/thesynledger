
# 💰 Account Marketplace — Economic Model & Incentive Mechanics (v0.1)

**Date:** 2025-10-27  
**Scope:** Fees, royalties, liquidity, incentives, tokenomics (if applicable), coordinator economics, and sustainability framework.

---

## 1. Economic Design Goals

The marketplace’s economic model must achieve **three simultaneous objectives**:

1. **Protocol sustainability** — generate recurring on-chain revenue from every account transfer.  
2. **Participant alignment** — ensure buyers, sellers, and coordinators are economically motivated to behave honestly.  
3. **Network liquidity** — incentivize account listings and price discovery in a new asset class (transferable accounts).

---

## 2. Revenue Streams (Protocol-Level)

| Source | Description | Fee Model | Payer |
|--------|--------------|------------|--------|
| **Marketplace Transaction Fee** | Core revenue on every settled transfer | 1.0–2.5% of sale price | Seller |
| **Coordinator Fee** | Paid to Ika-registered reshare coordinators | 0.25–0.75% | Buyer (bundled in escrow) |
| **Listing Fee (optional)** | Anti-spam & premium positioning | Flat or dynamic (based on valuation tier) | Seller |
| **Valuation Service Fee** | Optional advanced AI valuation | $5–$50 / account (off-chain) | Seller or buyer |
| **Provenance Verification Fee** | Optional KYC / “Clean Hands” proof | Variable | Seller |
| **Premium SDK/API Plan** | External dApp integration licensing | Subscription | Developer / enterprise |

Revenue split example per transaction (2% total):
- 1.2% → **Protocol Treasury**
- 0.5% → **Coordinator Pool**
- 0.3% → **Staker / Governance rewards**

---

## 3. Fee Distribution Framework

### 3.1 Core Split Logic (on-chain)
```text
on Settlement:
  fee = sale_price * fee_bps / 10_000
  coordinator_cut = fee * 25%
  treasury_cut = fee * 60%
  staker_cut = fee * 15%
```

### 3.2 Dynamic Fee Adjustments
- **Tiered fees** based on account valuation or reputation.
- **Discounts** for verified / compliant sellers.
- **Penalty multipliers** for non-compliance or dispute cases.

---

## 4. Royalty Model

**Goal:** enable perpetual creator / project participation in downstream resales.

| Feature | Mechanism | Example |
|----------|------------|---------|
| **Royalty Embed** | Project defines `royalty_bps` in `AccountHandle.policy` | A DeFi protocol earns 1% each time its veToken account is resold |
| **Chain-of-custody Enforcement** | Provenance module calculates royalty distribution automatically | Royalties can cascade to multiple entities |
| **Bypass Protection** | Royalty payment required for attestation validity (checked on-chain) | If unpaid, attestation rejected |

Royalties apply **only when the account type includes a creator identifier**, avoiding unnecessary friction for personal wallets.

---

## 5. Liquidity Mechanics

### 5.1 Account Liquidity Bootstrapping
| Mechanism | Description |
|------------|-------------|
| **Account Floor Pricing** | Optional oracle/AI engine ensures minimum reserve value. |
| **Liquidity Vaults** | Treasury funds seeded to auto-buy underpriced high-quality accounts (market making). |
| **Fractionalization (Phase 2)** | Divide ownership of high-value accounts (veTokens, game identities). |
| **Buy-Now-Pay-Later (BNPL)** | Off-chain credit / lending partners for high-value account purchases. |

### 5.2 Fee Rebates & Yield
- Sellers who **lock liquidity (listings)** for >N days earn **fee rebates** or **governance points**.  
- Buyers holding purchased accounts for long durations receive **loyalty yield** (protocol airdrops or XP).

---

## 6. Incentive Alignment

| Actor | Incentive | Reward Mechanism | Risk Control |
|--------|------------|------------------|---------------|
| **Sellers** | Earn sale proceeds | Reduced fees for verified/KYC accounts | Policy compliance enforcement |
| **Buyers** | Gain full control of valuable accounts | Access to reputation / liquidity rewards | Refund protection |
| **Coordinators** | Run reshare ceremonies reliably | Per-transaction coordinator fee | Slashing for mis-attestation |
| **Valuation Oracles** | Supply fair pricing data | Fee share + staking rewards | Reputation-weighted |
| **Protocol Stakers** | Secure governance and treasury | Fee share + voting rights | Slashing for mis-votes (optional) |

---

## 7. Governance and Treasury Model

### 7.1 Treasury Streams
- Settlement fees (primary)
- Coordinator registration deposits
- Penalty slashes
- Royalty unclaimed balances (after 90 days)

### 7.2 Treasury Allocations
| Allocation | % |
|-------------|---|
| Liquidity Vault / Market Making | 35% |
| Coordinator Subsidy Pool | 25% |
| Grants / Developer SDK Rewards | 20% |
| Audit & Security Fund | 10% |
| Governance Operations | 10% |

---

## 8. Tokenization Option (Optional Phase)

| Utility | Description |
|----------|-------------|
| **Fee Reduction** | Stake token to earn lower marketplace fee. |
| **Voting** | Control treasury disbursement, coordinator registration. |
| **Rewards** | Share of treasury income. |
| **Collaterization** | Use token as staking bond for coordinators or oracles. |

Token launch only when protocol achieves:
- ≥ $5M total account volume  
- ≥ 1000 active dWallets  
- ≥ 5 verified coordinators

---

## 9. Liquidity Flywheel Dynamics

1. More **high-quality listings** → more **buyers + price data**  
2. → better **valuation accuracy** → increased **buyer confidence**  
3. → more **sales volume** → higher **fee inflows**  
4. → greater **treasury liquidity** → funding of rebates and coordinator rewards  
5. → lowers friction → **accelerated marketplace growth**

---

## 10. Sustainability Model

| Cost Center | Funding Source | Notes |
|--------------|----------------|-------|
| Smart Contract Maintenance | Treasury | 5% annual allocation |
| Coordinator Operations | Coordinator Pool | 0.25–0.5% per tx |
| Frontend & API Hosting | Treasury / SDK subscriptions | Self-funding after 18 months |
| Audits | Audit Fund | Continuous |
| Ecosystem Grants | Developer fund | ROI measured by integration volume |

Projected break-even: **within 8–12 months** at ~$20M cumulative account volume (2% fee).

---

## 11. Strategic Incentive Extensions

- **Affiliate Layer:** verified agents earn 10–20% of protocol fees for onboarding listings.  
- **GameFi / DeFi Integrations:** external protocols can offer in-app account liquidity via SDK, earning rev-share.  
- **Cross-chain Account Bounties:** reward users for porting liquidity from EVM chains into Sui.  
- **Reputation NFTs:** awarded to early traders, conferring reduced fees and priority access to premium listings.

---

## 12. Key KPIs

| KPI | Target (12-month post-launch) |
|------|-------------------------------|
| GMV (Gross Market Volume) | $50M+ |
| Protocol Revenue | $1M+ |
| Unique Coordinators | 10+ |
| Active Listings | 5,000+ |
| Liquidity Vault ROI | >12% APY |
| Treasury Runway | >24 months |

---

## 13. Open Economic Questions

- Should coordinators stake collateral proportional to their volume?  
- What’s the optimal royalty cap to avoid friction?  
- Should verified users enjoy dynamic gas refunds?  
- When to introduce fractional account liquidity pools?

---

**End of Document**
