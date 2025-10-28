# Zero‑Trust Multi‑Chain Lending Protocol — Move API / ABI Specification (v0.1)

*Primary chain:* **Sui**  
*Language:* **Move (Sui)**  
*Packages:* `zt_mclp::core`, `zt_mclp::risk`, `zt_mclp::oracle`, `zt_mclp::utils`  
*Objects:* `OfferObject`, `LoanObject`, `PolicyObject`, `FTTObject`

> This is a **developer‑ready reference**: exact function signatures, structs, events, error codes, storage layout, and BCS schemas.  
> Assumes Sui Move 1.20+ with object model & event emission.

---

## 0. Conventions
- All amounts are **u128** in smallest units (asset decimals specified in specs).  
- Percentages in **basis points** (bps) unless noted.  
- Time fields are **u64** unix milliseconds.  
- Identifiers (`OfferID`, `LoanID`, `FTTID`) are **vector<u8>** (32‑byte hashes) in API layer; convenience helpers convert to fixed‑size types internally.
- Events are emitted via `event::emit<T>(...)`.

---

## 1. Modules

### 1.1 `module zt_mclp::core`
Core lending lifecycle, objects, accounting, future‑tx templates.

#### Structs
```move
struct OfferParams has store, drop {
    accepted_collateral: vector<AssetSpec>,
    borrow_assets: vector<AssetSpec>,
    max_capacity: u64,
    min_tenor_ms: u64,
    max_tenor_ms: u64,
    rate_model_id: vector<u8>,
    outflow_model: u8, // 0=Escrowed, 1=Direct
    lender_payouts: vector<PayoutRoute>, // per chain
}

struct OfferObject has key {
    id: UID,
    creator: address,
    params: OfferParams,
    capacity: u64,
    status: u8, // 0=Active,1=Paused,2=Exhausted,3=Cancelled
    created_at: u64,
}

struct LoanConfig has store, drop {
    ltv_max_bps: u64,
    lt_bps: u64,
    liq_bonus_bps: u64,
    min_conf: u64,
}

struct CollateralSpec has store, drop {
    chain: vector<u8>,
    asset: vector<u8>,
    decimals: u8,
}

struct DebtSpec has store, drop {
    chain: vector<u8>,
    asset: vector<u8>,
    decimals: u8,
    rate_model_id: vector<u8>,
}

struct Accounting has store {
    principal: u128,
    interest_index_bps: u64,
    last_accumulate_at: u64,
}

struct RiskSnapshot has store {
    hf_cached_bps: u64,
    last_oracle_round: u64,
}

struct PolicyRef has store, drop {
    policy_id: vector<u8>,
    chain: vector<u8>,
}

struct FTTRef has store, drop {
    ftt_id: vector<u8>,
    kind: u8, // 0=Liquidation,1=Withdraw,2=RepayReceipt,3=Draw
}

struct LoanObject has key {
    id: UID,
    offer_id: vector<u8>,
    borrower: address,
    lender: address,
    collateral: CollateralSpec,
    debt: DebtSpec,
    policy_refs: vector<PolicyRef>,
    ftt_refs: vector<FTTRef>,
    state: u8, // 0=Created,1=Collateralizing,2=Active,3=Repaid,4=Withdrawable,5=LiquidationPending,6=Liquidated,7=Closed
    acct: Accounting,
    risk: RiskSnapshot,
    cfg: LoanConfig,
    created_at: u64,
    updated_at: u64,
}
```

#### Policy & FTT Objects
```move
struct PolicyObject has key {
    id: UID,
    loan_id: vector<u8>,
    chain: vector<u8>,
    policy_hash: vector<u8>, // 32 bytes
    authority_pkg: address, // Sui package address binding
    status: u8, // 0=Active,1=Revoked
}

struct FTDomain has store, drop {
    chain: vector<u8>,
    asset: vector<u8>,
    to_addr: vector<u8>, // chain-encoded addr bytes
    min_amount: u128,
    max_amount: u128,
    not_before: u64,
    not_after: u64,
    nonce: vector<u8>, // unique per template
}

struct FTTObject has key {
    id: UID,
    template_hash: vector<u8>, // 32B
    domain: FTDomain,
    kind: u8, // see above
    enabled: bool,
}
```

#### Events
```move
struct EOfferCreated has copy, drop { offer_id: vector<u8>, creator: address, ts: u64 }
struct EOfferUpdated has copy, drop { offer_id: vector<u8>, ts: u64 }
struct EOfferStatus has copy, drop { offer_id: vector<u8>, status: u8, ts: u64 }

struct ELoanCreated has copy, drop { loan_id: vector<u8>, offer_id: vector<u8>, borrower: address, lender: address, ts: u64 }
struct ECollateralLocked has copy, drop { loan_id: vector<u8>, chain: vector<u8>, asset: vector<u8>, amount: u128, txid: vector<u8>, conf: u64, ts: u64 }
struct EDrawn has copy, drop { loan_id: vector<u8>, chain: vector<u8>, asset: vector<u8>, amount: u128, ts: u64 }
struct ERepaid has copy, drop { loan_id: vector<u8>, amount: u128, chain: vector<u8>, ts: u64 }
struct ELiquidationTriggered has copy, drop { loan_id: vector<u8>, hf_bps: u64, oracle_round: u64, ftt_id: vector<u8>, bounds_hash: vector<u8>, ts: u64 }
struct ELiquidationExecuted has copy, drop { loan_id: vector<u8>, proceeds: u128, chain: vector<u8>, txid: vector<u8>, ts: u64 }
struct EWithdrawAuthorized has copy, drop { loan_id: vector<u8>, ftt_id: vector<u8>, ts: u64 }
struct EClosed has copy, drop { loan_id: vector<u8>, reason: u8, ts: u64 } // 0=normal,1=liquidated

struct EPolicyBound has copy, drop { loan_id: vector<u8>, chain: vector<u8>, policy_hash: vector<u8>, ts: u64 }
struct EPolicyRevoked has copy, drop { loan_id: vector<u8>, chain: vector<u8>, ts: u64 }

struct EFTTRegistered has copy, drop { loan_id: vector<u8>, ftt_id: vector<u8>, template_hash: vector<u8>, kind: u8, ts: u64 }
struct EFTTStatus has copy, drop { ftt_id: vector<u8>, enabled: bool, ts: u64 }
```

#### Public Entry Functions
```move
public entry fun create_offer(
    creator: &signer,
    params: OfferParams,
    capacity: u64,
): (OfferObject);

public entry fun pause_offer(creator: &signer, offer: &mut OfferObject);
public entry fun resume_offer(creator: &signer, offer: &mut OfferObject);
public entry fun cancel_offer(creator: &signer, offer: &mut OfferObject);

public entry fun accept_offer(
    borrower: &signer,
    offer: &mut OfferObject,
    lender: address,
    cfg: LoanConfig,
    collateral: CollateralSpec,
    debt: DebtSpec,
): (LoanObject, PolicyObject, FTTObject); // returns initial policy+FTT (liq)

public entry fun register_collateral_deposit(
    caller: &signer,
    loan: &mut LoanObject,
    proof: vector<u8>, // attestation or SPV proof (opaque to core)
    amount: u128,
    txid: vector<u8>,
    conf: u64,
);

public entry fun draw(
    caller: &signer,
    loan: &mut LoanObject,
    amount: u128,
);

public entry fun repay(
    caller: &signer,
    loan: &mut LoanObject,
    amount: u128,
    chain: vector<u8>,
);

public entry fun repay_full(
    caller: &signer,
    loan: &mut LoanObject,
);

public entry fun check_health(
    loan: &mut LoanObject
): (u64 /* hf_bps */, u64 /* oracle_round */);

public entry fun liquidate(
    caller: &signer,
    loan: &mut LoanObject,
    max_repay: u128,
    ftt: &FTTObject,
);

public entry fun authorize_collateral_withdrawal(
    caller: &signer,
    loan: &mut LoanObject,
    ftt: &mut FTTObject, // withdraw template
);

public entry fun close(
    caller: &signer,
    loan: LoanObject,
);
```

#### Internal Helpers (selected)
```move
fun _emit_health_and_guard(loan: &mut LoanObject): (u64, u64);
fun _accumulate_interest(acct: &mut Accounting, now_ms: u64, rate_model_id: &vector<u8>);
fun _update_state(loan: &mut LoanObject, new_state: u8);
```

---

### 1.2 `module zt_mclp::oracle`
Price resolution, divergence checks, freshness guard.

#### Structs
```move
struct Price has store, drop { val: u128, expo: i32, round: u64, ts_ms: u64, src: u8 }
struct OracleSet has key { id: UID, sources: vector<address>, staleness_ms: u64, div_bps: u64 }
```

#### Public
```move
public fun resolve_median(oracle_set: &OracleSet, pairs: vector<vector<u8>>): (u128, i32, u64);
public fun is_fresh(oracle_set: &OracleSet, round: u64): bool;
public fun max_deviation_bps(oracle_set: &OracleSet, last_round: u64): u64;
```

Events
```move
struct EOracleUpdate has copy, drop { pair: vector<u8>, price: u128, expo: i32, round: u64, ts: u64 }
struct EOracleHalt has copy, drop { pair: vector<u8>, reason: u8, ts: u64 } // 0=stale,1=divergence
```

---

### 1.3 `module zt_mclp::risk`
On‑chain risk params registry.

#### Structs
```move
struct RiskParams has key, store {
    id: UID,
    asset: vector<u8>,
    chain: vector<u8>,
    max_ltv_bps: u64,
    lt_bps: u64,
    liq_bonus_bps: u64,
    haircut_vol_bps: u64,
    haircut_chain_bps: u64,
    min_conf: u64,
    oracle_ids: vector<address>,
    version: u64,
}
```

#### Public
```move
public entry fun set_params(admin: &signer, params: RiskParams);
public fun get(asset: &vector<u8>, chain: &vector<u8>): RiskParams;
```

Events
```move
struct ERiskParamsUpdated has copy, drop { asset: vector<u8>, chain: vector<u8>, version: u64, ts: u64 }
```

---

### 1.4 `module zt_mclp::utils`
Hashing, id derivation, domain checks, BCS helpers.

```move
public fun offer_id(creator: address, nonce: u64): vector<u8>;
public fun loan_id(offer_id: &vector<u8>, borrower: address, nonce: u64): vector<u8>;
public fun ftt_id(loan_id: &vector<u8>, chain: &vector<u8>, tpl: &vector<u8>): vector<u8>;
public fun keccak256(bytes: &vector<u8>) -> vector<u8>;
```

---

## 2. Access Control Model
- **Creator‑only**: pause/resume/cancel offer.  
- **Borrower or Lender**: draw/repay (per outflow model), request withdrawal auth.  
- **Keeper/Lender**: call `liquidate` when HF < 1.0.  
- **Risk Admin (timelocked multisig)**: `risk::set_params` only.  
- **No privileged fund movement** exists on any entrypoint.

---

## 3. Error Codes
- `E_OFFER_PAUSED: u64 = 1`
- `E_OFFER_EXHAUSTED: u64 = 2`
- `E_INVALID_PROOF: u64 = 10`
- `E_MIN_CONF: u64 = 11`
- `E_PRICE_STALE: u64 = 12`
- `E_PRICE_DIVERGENCE: u64 = 13`
- `E_HF_OK: u64 = 20`
- `E_STATE_INVALID: u64 = 30`
- `E_POLICY_MISMATCH: u64 = 31`
- `E_TEMPLATE_DISABLED: u64 = 32`
- `E_BOUNDS_VIOLATION: u64 = 33`
- `E_REPLAY: u64 = 34`
- `E_UNAUTHORIZED: u64 = 40`

---

## 4. Storage & Serialization
- All structs are serialized via **BCS**.  
- Event payload types are stable; avoid breaking changes post‑launch.  
- IDs (hashes) are 32B vectors; frontends should hex‑encode.

---

## 5. Gas & Metering Notes
- `register_collateral_deposit` includes proof parsing; requires higher gas budget.  
- `liquidate` path emits multiple events; gas scales with number of FTT validations.  
- Rate accrual runs **amortized** on mutating calls; no background jobs required.

---

## 6. Example Call Flows (Pseudocode)

**Accept Offer & Lock Collateral**
```
// borrower accepts offer and creates loan
let (loan, policy, ftt_liq) = core::accept_offer(&borrower, &mut offer, lender, cfg, coll_spec, debt_spec);

// later: register BTC deposit attestation
core::register_collateral_deposit(&caller, &mut loan, proof_bytes, amount, txid, conf);
```

**Liquidate**
```
let (hf_bps, round) = core::check_health(&mut loan);
assert!(hf_bps < 10_000, E_HF_OK);
core::liquidate(&keeper, &mut loan, max_repay, &ftt_liq);
```

**Repay & Withdraw**
```
core::repay(&borrower, &mut loan, amount, debt_chain);
core::repay_full(&borrower, &mut loan);
core::authorize_collateral_withdrawal(&borrower, &mut loan, &mut ftt_withdraw);
```

---

## 7. ABI Summary (for codegen)

### Entry Functions
- `create_offer(creator, params, capacity) -> OfferObject`
- `pause_offer(creator, offer)`
- `resume_offer(creator, offer)`
- `cancel_offer(creator, offer)`
- `accept_offer(borrower, offer, lender, cfg, collateral, debt) -> (LoanObject, PolicyObject, FTTObject)`
- `register_collateral_deposit(caller, loan, proof, amount, txid, conf)`
- `draw(caller, loan, amount)`
- `repay(caller, loan, amount, chain)`
- `repay_full(caller, loan)`
- `check_health(loan) -> (hf_bps, oracle_round)`
- `liquidate(caller, loan, max_repay, ftt)`
- `authorize_collateral_withdrawal(caller, loan, ftt)`
- `close(caller, loan)`

### Events
- `EOfferCreated`, `EOfferUpdated`, `EOfferStatus`
- `ELoanCreated`, `ECollateralLocked`, `EDrawn`, `ERepaid`
- `ELiquidationTriggered`, `ELiquidationExecuted`
- `EWithdrawAuthorized`, `EClosed`
- `EPolicyBound`, `EPolicyRevoked`
- `EFTTRegistered`, `EFTTStatus`
- `ERiskParamsUpdated`
- `EOracleUpdate`, `EOracleHalt`

---

## 8. Versioning & Compatibility
- **v0.1** — Initial developer reference aligned to Formal Spec v0.1  
- Future versions will only **append** fields to structs or add new events/entries; no breaking changes without migration tooling.

