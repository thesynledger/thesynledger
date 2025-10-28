# Zero‑Trust Multi‑Chain Lending Protocol — Risk Parameter Table (v0.1)

This table defines baseline **risk parameters**, **liquidation bands**, and **oracle/security configurations** for initial supported assets and chains.

---

## 1. Purpose
These parameters are used by:
- the **Risk Engine** in Sui smart contracts to validate loan configurations;
- the **Oracle Adapter** for price weighting and staleness checks;
- the **Frontend** to display risk warnings and compute Health Factor (HF).

Each row is versioned with `risk_version` to allow safe protocol upgrades.

---

## 2. Global Defaults

| Parameter | Symbol | Default | Notes |
|------------|---------|----------|-------|
| Minimum HF | `HF_min` | `1.00` | Below this → liquidation allowed |
| Oracle Staleness Limit | `Δt_oracle` | 90s | Max age of accepted oracle price |
| Divergence Threshold | `τ_div` | 2.5 % | Max deviation between sources before halt |
| Max Liquidation Bonus | `bonus_max` | 10 % | Prevents over‑incentivized liqs |
| Min Confirmation Depth | `conf_min` | chain‑specific | See per‑asset table |
| Rate Model | `R(x)` | kinked (base + slope1, slope2) | x = utilization |

---

## 3. Per‑Asset / Chain Risk Parameters

| Asset | Chain | Type | Max LTV | Liq Thresh (LT) | Liq Bonus (%) | Haircut Volatility (%) | Haircut Chain (%) | Min Conf | Oracle Sources | Notes |
|--------|--------|------|---------|------------------|----------------|-------------------------|-------------------|-----------|----------------|--------|
| **BTC** | Bitcoin | Native | 0.65 | 0.70 | 7.5 | 5 | 2 | 3 | Chainlink + Pyth | Baseline collateral; 3‑conf rule |
| **ETH** | Ethereum | Native | 0.70 | 0.75 | 6.0 | 6 | 1.5 | 12 blocks | Chainlink + Redstone | Gas‑fee bursts → extra haircut |
| **SUI** | Sui | Native | 0.70 | 0.75 | 5.0 | 4 | 0 | – | Native Oracle | Local reference collateral |
| **USDC** | Sui | Stablecoin | 0.90 | 0.92 | 1.0 | 0 | 0 | – | Native Oracle | Borrow asset; minimal risk |
| **SOL** | Solana | Native | 0.60 | 0.68 | 8.0 | 8 | 3 | 150 slots | Pyth + Switchboard | High volatility; apply strong haircut |
| **BNB** | BNB Chain | Native | 0.65 | 0.72 | 7.0 | 6 | 2 | 20 blocks | Chainlink + Band | Added haircut for chain risk |

---

## 4. Derived Risk Metrics

### 4.1 Health Factor Buffer
`HF_buffer = LT / LTV_max − 1`

| Asset | HF_buffer |
|--------|-----------|
| BTC | 7.7 % |
| ETH | 7.1 % |
| SUI | 7.1 % |
| SOL | 13.3 % |
| BNB | 10.7 % |

### 4.2 Effective Collateral Factor (after haircuts)
`CF_eff = LTV_max × (1 − (haircut_vol + haircut_chain)/100)`

| Asset | CF_eff |
|--------|--------|
| BTC | 0.59 |
| ETH | 0.62 |
| SUI | 0.67 |
| SOL | 0.49 |
| BNB | 0.57 |

---

## 5. Oracle Configuration

| Source | Coverage | Push Freq | Trust Weight | Fallback Policy |
|---------|-----------|-----------|---------------|----------------|
| **Chainlink** | ETH, BTC, BNB | 30 s | 0.6 | Use TWAP 5 min |
| **Pyth** | BTC, SOL | 15 s | 0.3 | Medianize with others |
| **Redstone** | ETH | 20 s | 0.1 | TWAP fallback |
| **Native Oracle (Sui)** | SUI, USDC | 10 s | 0.8 | Last good price |

`TrustWeight` determines the medianized weight.  
`FallbackPolicy` defines substitution when freshness or deviation fails.

---

## 6. Chain‑Specific Latency Multipliers

| Chain | Finality (s) | Liquidation Latency Multiplier λ | Rationale |
|--------|--------------|-----------------------------------|------------|
| Bitcoin | 600 s (3 conf) | 1.10 | Long block interval |
| Ethereum | 60 s (12 blk) | 1.05 | Moderate delay |
| Sui | 2 s | 1.00 | Base chain |
| Solana | 4 s × 150 slots | 1.15 | Slot variance |
| BNB Chain | 45 s × 20 blk | 1.08 | Occasional reorgs |

Liquidation thresholds are multiplied by `λ` for real‑time HF calculations to absorb confirmation lag risk.

---

## 7. Governance & Upgradeability
- **Risk Committee** may update any parameter with a 48 h timelock.
- Every update emits `RiskParamsUpdated(asset, chain, version)`.
- Frontend auto‑pulls latest version from on‑chain storage or IPFS mirror.

---

## 8. Sample On‑Chain Structs (Move)

```move
struct RiskParams has key, store {
    asset: vector<u8>,
    chain: vector<u8>,
    max_ltv: u64,
    liq_thresh: u64,
    liq_bonus_bps: u64,
    haircut_vol_bps: u64,
    haircut_chain_bps: u64,
    min_conf: u64,
    oracle_ids: vector<address>,
    risk_version: u64,
}
```

---

## 9. Version History
| Version | Date | Description |
|----------|------|-------------|
| v0.1 | 2025‑10‑27 | Initial parameterization for BTC, ETH, SUI, SOL, BNB, USDC |

