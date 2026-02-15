# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js/TypeScript
- **Database:** PostgreSQL
- **Blockchain:** Solana (PumpFun token launch)

## Project: 777 Slot Machine Token Platform

### Overview

A single-page website for the 777 token launched on PumpFun. The page fits on one screen (25-27" monitor). Core feature is a slot machine that holders can spin to win SOL rewards.

### Key Components

#### Website (Single Page)
- Token CA display (starts as "CA: To be added", updated via admin panel)
- "Buy on Pump" button
- X community link button
- 777 Slot Machine (main content)
- Buyback & burn countdown timer
- Current reward display (always shows reward% of RewardWallet balance)
- Winner history list
- Spin queue display
- Rules/explanation text

#### Slot Machine Mechanics
- **Two requirements to spin:**
  1. Hold required amount of 777 tokens (default: 500,000 at launch, adjustable via admin)
  2. Transfer required SOL to the 777 Verification Wallet (default: 0.01 SOL at launch, adjustable via admin)
- **Win chance:** Base 3%. Increases +1% per extra 0.01 SOL sent (e.g., 0.02 SOL = 4%, 0.03 SOL = 5% cap)
- **Queue system:** If slot is spinning for another holder, new entries go to a waiting queue showing: holder address, transferred SOL, win %
- **Active spin display:** Shows current holder address, transferred SOL, win %
- **Reward:** Configurable % (default 30%) of RewardWallet balance, auto-transferred to winner

#### Winner History
- Winner address (with copy button)
- Transferred SOL amount
- Win percentage
- SOL reward amount
- Transaction signature (links to Solscan)

#### Admin Panel (live updates, no redeployment needed)
- Set/update token CA
- Adjust required token holding amount
- Adjust minimum SOL transfer for spin
- Pause/resume slot machine (paused = still queues holders, shows pause message)
- Adjust reward % of RewardWallet balance
- Adjust buyback & burn timer duration
- Button: trigger transfer from Verification Wallet to Creator Wallet
- Button: trigger buyback and burn from Creator Wallet

#### Wallet System
- **Verification Wallet (777):** Receives SOL from spin payments
  - On timer expiry: transfers 90% of balance to Creator Wallet
- **Creator Wallet:** Deployed 777 on PumpFun, receives funds from Verification Wallet
  - Uses 50% of received amount to buyback 777 tokens, then burns them
- **Treasury Wallet:** Receives 70% of claimed creator fees
- **Reward Wallet:** Receives 30% of claimed creator fees; funds slot machine rewards

#### Automated Processes
- Every 30 seconds: auto-claim PumpFun creator fees from Creator Wallet
  - 70% of claimed fees -> Treasury Wallet
  - 30% of claimed fees -> Reward Wallet
- Reward display updates when Reward Wallet receives funds
- Buyback & burn timer triggers Verification Wallet -> Creator Wallet transfer

#### Database (PostgreSQL)
Tables should store:
- Spin transactions: holder address, SOL transferred, win %, queue position, spin result, timestamp
- Reward transfers: winner address, transaction signature, SOL won, timestamp
- Configuration: token CA, required holdings, min SOL, reward %, timer duration, pause state
- Fee claims: claim transaction signature, total claimed, treasury amount, reward amount, timestamp
- Buyback/burn events: transaction signatures, amounts, timestamp

## Development

### Project Structure
```
777/
├── client/     # React + Vite + Tailwind frontend
├── server/     # Express + Prisma backend
├── shared/     # Shared TypeScript types
```

### Commands
- `npm install` — install all workspace dependencies from root
- `npm run dev` — start both client and server
- `npm run dev:client` — start Vite dev server (port 5173)
- `npm run dev:server` — start Express server (port 3001)
- `npm run build` — build all workspaces

### Database
- Prisma schema: `server/prisma/schema.prisma`
- Copy `.env.example` to `.env` and set `DATABASE_URL`
