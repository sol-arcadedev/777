# 777 — The Creator Fee Slot

A Solana-powered slot machine platform where token holders spin to win SOL rewards funded by PumpFun creator fees. Built for the 777 token launched on PumpFun.

## How It Works

777 deposits a portion of the creator fees into a **Reward Wallet**, gradually increasing the jackpot. Holders who meet the requirements can spin the slot machine for a chance to win a percentage of the reward pot. The SOL transferred to spin is used for **adding liquidity**, **buyback and burn**, and partly added to the **current reward**. As the market cap grows, a larger share of creator fees goes toward the jackpot.

### Spin Requirements

1. **Hold tokens** — A minimum amount of 777 tokens (configurable, default: 500,000)
2. **Transfer SOL** — Send the minimum SOL amount to the Verification Wallet (configurable, default: 0.01 SOL)
3. **Spin or queue** — The slot spins immediately or the holder joins a waiting queue

### Win Mechanics

- Base win chance starts at 3%, increasing +1% per extra 0.01 SOL sent (capped at 5%)
- Winners receive a configurable percentage (default: 30%) of the Reward Wallet balance
- Rewards are auto-transferred to the winner's wallet on-chain

## Architecture

```
777/
├── client/          # React + Vite + Tailwind CSS frontend
├── server/          # Express + Prisma + TypeScript backend
├── shared/          # Shared TypeScript type definitions
└── .env.example     # Environment variable template
```

### Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, TypeScript, Tailwind CSS, Vite |
| Backend    | Node.js, Express, TypeScript        |
| Database   | PostgreSQL, Prisma ORM              |
| Blockchain | Solana, @solana/web3.js             |
| Realtime   | WebSocket (live queue, results, balance updates) |

### Wallet System

| Wallet        | Purpose                                                    |
|---------------|------------------------------------------------------------|
| Verification  | Receives SOL from spin payments                            |
| Creator       | Receives forwarded SOL; used for buyback, burn, and fees   |
| Treasury      | Receives 70% of claimed creator fees                       |
| Reward        | Receives 30% of claimed creator fees; funds slot rewards   |

### Automated Processes

- **Fee claiming** — Creator fees are auto-claimed at a configurable interval (default: every 30 seconds) and split between Treasury (70%) and Reward (30%) wallets
- **Buyback and burn** — On timer expiry, SOL is forwarded from the Verification Wallet to the Creator Wallet, where a portion is used to buy back 777 tokens and burn them
- **Reward updates** — The reward display updates in real-time via WebSocket as the Reward Wallet balance changes

## Features

- **Pixel-art slot machine** with animated reels, lever pull, light bulbs, and confetti effects
- **Sound effects** for reel spinning, jackpot wins, and SOL refunds
- **Live spin queue** with real-time WebSocket updates
- **Winner history** with on-chain transaction links (Solscan)
- **Spin history** showing reel symbols for every spin
- **Buyback and burn timer** with live countdown
- **Admin panel** for live configuration changes without redeployment
- **Responsive single-page layout** designed for 25-27" monitors

### Admin Panel

All settings can be adjusted live without redeployment:

- Token contract address (CA)
- Required token holding amount
- Minimum SOL transfer for spins
- Win chance percentage
- Reward percentage of wallet balance
- Buyback and burn timer duration
- Fee claim interval
- Pause/resume slot machine
- Manual triggers for wallet transfers and buyback

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Solana wallet keypairs (Verification, Creator, Reward)

### Installation

```bash
# Clone the repository
git clone https://github.com/sol-arcadedev/777.git
cd 777

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/seven77
SOLANA_RPC_URL=https://api.devnet.solana.com
VERIFICATION_WALLET_PRIVATE_KEY=
CREATOR_WALLET_PRIVATE_KEY=
REWARD_WALLET_PRIVATE_KEY=
TREASURY_WALLET_ADDRESS=
PORT=3001
ADMIN_PASSWORD=
```

### Database Setup

```bash
# Generate Prisma client and run migrations
cd server
npx prisma migrate dev
cd ..
```

### Development

```bash
# Start both client and server
npm run dev

# Or start individually
npm run dev:client    # Vite dev server on port 5173
npm run dev:server    # Express server on port 3001
```

### Production Build

```bash
npm run build
```

## Database Schema

| Table            | Purpose                                              |
|------------------|------------------------------------------------------|
| Configuration    | Token CA, spin settings, timer, pause state          |
| SpinTransaction  | Holder address, SOL transferred, win %, result, reel symbols |
| RewardTransfer   | Winner address, TX signature, SOL won                |
| FeeClaim         | Claim TX signature, amounts split to treasury/reward |
| BuybackBurn      | Transfer, buyback, and burn TX signatures and amounts|

## Deployment

Designed to run on free-tier providers:

| Service  | Recommended Provider       |
|----------|----------------------------|
| Frontend | Vercel, Netlify            |
| Backend  | Render, Railway            |
| Database | Neon, Supabase (PostgreSQL)|

## License

All rights reserved.
