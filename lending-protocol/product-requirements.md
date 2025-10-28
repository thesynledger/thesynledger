# Zero-Trust Multi-Chain Lending Protocol

## Overview
The **Zero-Trust Multi-Chain Lending Protocol** will enable borrowers to post **native assets** (including BTC, ETH, and others) as collateral and borrow **other native assets** across chains - without wrapping, bridging, or introducing centralized custodians.

This protocol will be powered entirely by **dWallets** and Ika’s **2PC-MPC system**, allowing on-chain smart contracts (on Sui) to enforce lending logic while controlling native assets on multiple external blockchains.

The protocol will be fully **non-custodial** - neither the platform nor any set of operators will ever have unilateral control over user funds. Instead, loan terms, collateralization ratios, liquidation triggers, and repayment flows will be enforced programmatically via Sui smart contracts that control the collateral-holding dWallets.

## Desirable Features
- **Native asset collateral & loans**:
    - Support BTC, ETH, and at least two other major chains at launch.
    - All collateral and loans remain in native form on their respective blockchains.
- **Zero-trust enforcement**:
    - All loans are strictly p2p, i.e. the user share remains private and liquidations are based on future transactions signed by the borrower, and addressed directly to the lender.
    - Smart contracts on Sui enforce all loan terms.
    - No entity can seize or move assets outside agreed-upon rules.
- **Configurable loan terms**:
    - Collateral ratios, interest rates, liquidation thresholds are agreed upon between the borrower and lender for each loan.
- **Liquidations**:
    - If liquidation conditions are met, the lender can complete the liquidation future transaction.
- **User-friendly UX**:
    - Simplify borrow/repay flow for users from different chains.
    - Transparent display of cross-chain positions and risks.
- **Extendable architecture**:
    - Easy integration for additional chains or collateral types.
- **Potential for future support of**:
    - NFTs and/or RWA collateral.
    - Entire accounts (dWallets) as collateral, specifically for enabling borrowing against entire portfolios, illiquid assets, staked positions (without requiring an LST) or profitable DeFi positions (e.g. leveraged longs).


## Deliverables
- **Core lending protocol smart contracts** (Sui) enforcing zero-trust lending logic.
- **dWallet integration layer** to hold and control collateral on external chains.
- **Price oracle integration** for multi-chain asset pricing.
- **Front-end reference app**: Deposit collateral, borrow assets, monitor positions, repay, and withdraw.
- **Developer documentation** covering protocol architecture, dWallet integration, and governance configuration.
- **Testnet deployment** with at least Bitcoin testnet BTC and Sui testnet USDC as collateral/loan pairs.
- **Security review** (protocol + dWallet integration) and published audit plan/report
- **Optional**:
    - Liquidation tools / services that automatically trigger and execute liquidations on behalf of lenders.