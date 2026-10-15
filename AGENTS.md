# TipJar — Buy Me a Coffee with USDC

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app.

---

## What This App Does

A "Buy Me a Coffee" style tip jar on Arc Testnet. Users tip USDC in preset or custom amounts, leave a name and message, and the contract automatically splits incoming USDC between two recipients by configurable basis points. Recipients can only withdraw their own share. The owner can set a fundraising goal shown as a progress bar. The last 12 tips are displayed in a feed.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Arc Light design
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, build with `forge build`.
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC 6-decimal ERC-20 at `0x3600000000000000000000000000000000000000`
- Fonts: Space Grotesk (display), DM Sans (body), JetBrains Mono (mono)

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|----------|-------|---------|----------|
| TipJar | Arc Testnet | `0xbdf78c9958efb9ba5bc6a5aec880e2eee718c31c` | [View](https://explorer.testnet.arc.io/address/0xbdf78c9958efb9ba5bc6a5aec880e2eee718c31c) |

## Key Files

- `src/contract.ts` — contract address, ABI import, chain ID
- `src/components/TipJarApp.tsx` — main shell (layout, header, wallet connection, wrong-chain guard)
- `src/components/GoalCard.tsx` — live total raised + progress bar
- `src/components/TipForm.tsx` — preset/custom amount + name/message + approve+tip flow
- `src/components/RecipientCard.tsx` — per-recipient split % + pending balance
- `src/components/RecentTips.tsx` — ring-buffer feed of last 12 tips

## Constructor Args (deployed with)

- `usdc_`: `0x3600000000000000000000000000000000000000` (Arc Testnet USDC)
- `recipientA_`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer — replace for production)
- `recipientB_`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer — replace for production)
- `bpsA_`: `7000` (70% to A, 30% to B)
- `goalAmount_`: `100000000` (100 USDC in 6-decimal units)
- `owner_`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer)

## To Run

```bash
bun install
bun run dev
```
