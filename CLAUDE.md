# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **npm workspaces monorepo** for a Vietnamese lottery analysis system ("Hệ thống phân tích xổ số"). It consists of three workspaces:

- `app/` — Expo 54 mobile app (React Native + Expo Router v3, TypeScript)
- `server/` — NestJS 11 backend (TypeScript, Jest)
- `ai/` — Python FastAPI AI service (Python 3.11+)

## Commands

Run all commands from the **monorepo root** unless working exclusively inside a workspace.

### Install

```bash
npm install          # Install Node.js dependencies (app + server)
pip install -r ai/requirements.txt  # Install AI Python dependencies
```

### Development

```bash
npm run dev           # Run app, server, and AI concurrently
npm run app:dev       # Expo app only (expo start)
npm run server:dev    # NestJS server only (nest start --watch)
npm run ai:dev        # AI Python server only (fastapi)
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

| Context          | Key entities                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Identity**     | User                                                                                               |
| **Lottery Core** | LotteryResult, LotteryNumber                                                                       |
| **Statistics**   | FrequencyStatistic, GanStatistic, ConsecutiveLoss, HeadTailStatistic, NumberPairStatistic, Heatmap |
| **Analytics**    | TrendAnalysis, CycleAnalysis, CorrelationAnalysis, Prediction                                      |
| **Strategy**     | Strategy, StrategyCondition, ConditionNode, BacktestRun, BacktestResult                            |
| **Journal**      | BetEntry, BetPerformance                                                                           |
| **Knowledge**    | KnowledgeItem                                                                                      |
| **News**         | NewsArticle, Signal                                                                                |
| **AI**           | AIInsight, ChatConversation, ChatMessage, AIReport                                                 |

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
- **Safe Area**: All screens **must** use a safe area wrapper (e.g., `<SafeAreaView>` from `react-native` or a custom `SafeView` component) to handle device notches, status bars, and navigation bars correctly on all platforms.

### Server workspace (`server/`)

Standard NestJS module layout under `server/src/`:

- `main.ts` — bootstrap entry point
- `app.module.ts` — root module
- Controllers and services follow NestJS conventions (`app.controller.ts`, `app.service.ts`)

The server is a scaffold; domain modules (one per bounded context above) are to be added under `server/src/`.

## Project Rules (Dành cho tất cả thành viên)

Các quy tắc bên dưới được tổng hợp từ những lỗi và vấn đề đã gặp trong quá trình phát triển. **BẮT BUỘC** tuân thủ.

### R1 — NestJS: Không khai báo lại JwtAuthGuard trên controller

`JwtAuthGuard` đã được đăng ký global qua `APP_GUARD` trong `server/src/app.module.ts`.

- **ĐÚNG:** Controller mới không cần `@UseGuards()`. Route mặc định đã được bảo vệ.
- **ĐÚNG:** Dùng `@Public()` từ `server/src/auth/decorators/public.decorator.ts` để mở khóa route.
- **SAI:** `@UseGuards(JwtAuthGuard)` trên controller → gây `UnknownDependenciesException` vì NestJS cố resolve `JwtService` trong scope module hiện tại.

### R2 — TypeORM: Cascade + orphanRemoval

Khi dùng `@OneToMany(..., { cascade: true })` trên relation mà child elements có thể bị xóa/thay thế (ví dụ: `Strategy.conditions`), **luôn thêm `orphanedRowAction: 'delete'`** để tránh orphaned records trong database.

### R3 — Monorepo: Không dùng `process.cwd()` để resolve đường dẫn file

Trong monorepo, `process.cwd()` trả về thư mục thực thi command (có thể là root, không phải workspace). Luôn dùng `__dirname` hoặc `path.resolve(__dirname, '...')` thay thế.

### R4 — App: Safe Area nhất quán

Tất cả screen **phải** dùng component `SafeView`, `SafeViewScrollable`, hoặc `SafeViewModal` từ `app/components/safe-view.tsx`. **KHÔNG** import trực tiếp `SafeAreaView` từ `react-native-safe-area-context` hay `react-native`.

### R5 — App: Chỉ dùng theme token đã khai báo

Không reference màu chưa tồn tại trong `app/constants/theme.ts` (ví dụ: `colors.border` khi chưa có `border` trong `Colors.light`/`Colors.dark`). Nếu cần token mới → thêm vào `Colors.light` VÀ `Colors.dark` trước.

### R6 — App: Validation frontend đồng bộ backend DTO

Mọi form gửi data lên API **phải** validate ở frontend theo chuẩn DTO backend (`server/src/**/*.dto.ts`) trước khi gọi API. Nếu backend có `@MinLength(6)`, `@IsEmail()` → frontend phải bắt tương tự.

### R7 — AI: Không dùng lệnh shell phụ thuộc platform

Trong workspace `ai/`, không dùng `os.popen("date")` hay lệnh shell khác phụ thuộc OS. Dùng thư viện chuẩn Python (`datetime`, `pathlib`, v.v.).

### R8 — Expo SDK 54: Luôn tra cứu docs trước khi code

Expo SDK 54 / Router v3 có breaking changes. **KHÔNG** dựa vào kiến thức cũ — tra cứu docs tại `https://docs.expo.dev/versions/v54.0.0/` trước khi viết hoặc sửa code Expo/React Native.

### R9 — Quy tắc thêm rule/config mới

Khi yêu cầu "thêm rule" mà không chỉ rõ vị trí → mặc định đặt ở project root. Nếu không chắc, hỏi lại người yêu cầu.

### R10 — Env: Đồng bộ `.env.example`

Khi thêm biến môi trường mới vào `.env`, **bắt buộc** cập nhật `.env.example` tương ứng (giá trị mẫu, không phải giá trị thật).

## Custom Agents

Dự án có 4 custom agents hoạt động theo pipeline: **Planner → Runner (Executor ↔ Auditor loop)**.

### Cách sử dụng

```
@planner <yêu cầu>     # Bước 1: Lên plan kiến trúc (KHÔNG code)
@runner                 # Bước 2: Tự động chạy Executor → Auditor loop đến khi PASS
```

Hoặc chạy từng agent thủ công:
```
@executor               # Triển khai code theo plan
@auditor                # Kiểm tra tuân thủ
```

### Mô tả agents

| Agent | Nhiệm vụ | Có quyền viết code? | Output |
|-------|-----------|:-------------------:|--------|
| **@planner** | Phân tích yêu cầu, thiết kế kiến trúc, tạo plan chi tiết | ❌ Chỉ viết docs | `docs/plans/<name>.plan.md` |
| **@runner** | Điều phối vòng lặp Executor → Auditor tự động | ❌ Chỉ delegate | Báo cáo PASS/FAIL |
| **@executor** | Triển khai code đúng theo plan, tuân thủ rules R1-R10 | ✅ | Source code files |
| **@auditor** | Kiểm tra code vs plan, rules, yêu cầu gốc. Chạy lint/build/test | ❌ Chỉ đọc & test | `docs/plans/<name>.audit.md` |

### Pipeline hoạt động

1. **@planner** tạo plan tại `docs/plans/<feature>.plan.md` với đầy đủ: entity, DTO, endpoints, UI, thứ tự triển khai, tiêu chí kiểm thử.
2. **@runner** điều phối vòng lặp tự động (tối đa 5 iterations):
   - Gọi **@executor** triển khai code (lần đầu: theo plan, lần sau: sửa lỗi audit)
   - Gọi **@auditor** kiểm tra 7 giai đoạn
   - Nếu **PASS** → kết thúc, báo thành công
   - Nếu **FAIL** → truyền danh sách lỗi cho @executor, lặp lại
3. User chỉ cần chạy `@planner` rồi `@runner`, pipeline tự xử lý đến khi code đạt chuẩn.

### Quy tắc

- **@executor KHÔNG được tự suy đoán kiến trúc** — phải có plan từ @planner.
- **@auditor LUÔN chạy sau @executor** — không bỏ qua bước kiểm tra.
- **@auditor KHÔNG tự sửa code** — chỉ báo cáo, @executor sửa.
- **@runner giới hạn 5 iterations** — nếu vẫn FAIL, dừng và báo user xem lại plan.
