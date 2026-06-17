# Monorepo Setup Guide

Dự án này đã được cấu hình as a monorepo với npm workspaces.

## Cài đặt

```bash
npm install
```

## Scripts

### Development

Chạy cả app và server:

```bash
npm run dev
```

Chạy riêng:

```bash
npm run app:dev      # Expo app
npm run server:dev   # NestJS server (watch mode)
```

### Build

```bash
npm run build        # Build cả app và server
npm run server:build # Build chỉ server
```

### Testing & Linting

```bash
npm run lint         # Lint cả app và server
npm run test         # Run server tests
npm run test:e2e     # Run server e2e tests
```

## Workspaces

- **app** - Expo mobile app
- **server** - NestJS backend

Mỗi workspace có `package.json` riêng và được quản lý độc lập nhưng dependencies được share.
