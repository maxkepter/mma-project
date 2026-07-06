# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **npm workspaces monorepo** for a Vietnamese lottery analysis system ("Hệ thống phân tích xổ số"). It consists of two workspaces:

- `app/` — Expo 54 mobile app (React Native + Expo Router v3, TypeScript)
- `server/` — NestJS 11 backend (TypeScript, Jest)

## Commands

Run all commands from the **monorepo root** unless working exclusively inside a workspace.

### Install

```bash
npm install
```

### Development

```bash
npm run dev           # Run both app and server concurrently
npm run app:dev       # Expo app only (expo start)
npm run server:dev    # NestJS server only (nest start --watch)
```

### Build

```bash
npm run build         # Build both workspaces
npm run server:build  # Build server only (nest build)
```

### Lint

```bash
npm run lint          # Lint both workspaces
npm run app:lint      # Lint app only (expo lint)
npm run server:lint   # Lint server only (eslint --fix)
```

### Testing (server only — the app has no test suite yet)

```bash
npm run test                          # Run all server unit tests (jest)
npm run test:e2e                      # Run server e2e tests
cd server && npx jest <file-path>     # Run a single test file
cd server && npx jest --watch         # Jest watch mode
cd server && npx jest --coverage      # Coverage report
```

Unit test files live alongside their source files (`*.spec.ts` in `server/src/`). E2e tests are in `server/test/`.

### Platform-specific app targets

```bash
npm run app:ios       # Open iOS simulator
npm run app:android   # Open Android emulator
npm run app:web       # Open in browser
```

## Architecture

### Domain model

The system is organized into **nine bounded contexts** (DDD):

| Context | Key entities |
|---|---|
| **Identity** | User |
| **Lottery Core** | LotteryResult, LotteryNumber |
| **Statistics** | FrequencyStatistic, GanStatistic, ConsecutiveLoss, HeadTailStatistic, NumberPairStatistic, Heatmap |
| **Analytics** | TrendAnalysis, CycleAnalysis, CorrelationAnalysis, Prediction |
| **Strategy** | Strategy, StrategyCondition, ConditionNode, BacktestRun, BacktestResult |
| **Journal** | BetEntry, BetPerformance |
| **Knowledge** | KnowledgeItem |
| **News** | NewsArticle, Signal |
| **AI** | AIInsight, ChatConversation, ChatMessage, AIReport |

`LotteryResult → (1:N) → LotteryNumber` is the root data source. All statistics and analytics entities are derived from it. User-owned entities (Strategy, BetEntry, etc.) all carry a `userId` FK. Full entity definitions are in `docs/diagram/domain/entities.md`.

### App workspace (`app/`)

Uses **Expo Router v3** (file-based routing). Route files live under `app/app/`:
- `app/app/_layout.tsx` — root layout
- `app/app/(tabs)/` — tab navigator screens
- `app/app/modal.tsx` — modal screen

Shared primitives are in `app/components/` (themed wrappers, haptic tab, parallax scroll view). Theme tokens live in `app/constants/theme.ts`.

> **Important:** Expo SDK 54 / Router v3 have breaking changes. **Do not rely on training-weight knowledge of Expo APIs — consult the versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing or modifying any Expo/React Native code.** Route param typings, screen configuration, and several core component APIs have changed.

### UI/UX Design Guidelines (App)
- **Mobile-First & Responsive**: Design primarily for mobile phones. Use Flexbox and responsive sizing strategies (safe areas, relative dimensions) to ensure the UI adapts gracefully to different screen sizes.
- **Minimalist Interface (Giao diện tối giản)**: Keep the interface clean and clutter-free. Use generous whitespace, clear typography, and a restrained color palette (referencing `app/constants/theme.ts`). Focus on core data and actions without unnecessary decorative elements.

### Server workspace (`server/`)

Standard NestJS module layout under `server/src/`:
- `main.ts` — bootstrap entry point
- `app.module.ts` — root module
- Controllers and services follow NestJS conventions (`app.controller.ts`, `app.service.ts`)

The server is a scaffold; domain modules (one per bounded context above) are to be added under `server/src/`.
