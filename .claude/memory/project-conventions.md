---
name: project-conventions
description: "Tổng hợp các convention và pattern chuẩn trong dự án — áp dụng cho tất cả thành viên"
metadata:
  node_type: memory
  type: project
---

# Server (NestJS) Conventions

## Auth Guard
- `JwtAuthGuard` đã global qua `APP_GUARD` → KHÔNG thêm `@UseGuards(JwtAuthGuard)` ở controller.
- Dùng `@Public()` decorator cho route công khai.
- Chi tiết: xem Rule R1 trong `CLAUDE.md`.

## TypeORM
- PK dùng `PrimaryGeneratedColumn('uuid')`.
- Cascade relation có child thay thế được → bắt buộc `orphanedRowAction: 'delete'`.
- Đường dẫn file: dùng `__dirname`, KHÔNG dùng `process.cwd()`.

## DTO & Validation
- Global `ValidationPipe` đã bật (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Query number params dùng `@Transform(({ value }) => parseInt(value, 10))`.
- Frontend phải validate đồng bộ backend DTO trước khi gọi API.

## Module Structure
- Mỗi bounded context = 1 thư mục dưới `server/src/` chứa: module, controller, service, DTOs, entities.
- Module đăng ký entity qua `TypeOrmModule.forFeature()` và export `TypeOrmModule`.

# App (Expo/React Native) Conventions

## Safe Area
- Luôn dùng `SafeView` / `SafeViewScrollable` / `SafeViewModal` từ `app/components/safe-view.tsx`.
- KHÔNG import trực tiếp `SafeAreaView` từ thư viện bên ngoài.

## Theme
- Tất cả màu sắc phải tồn tại trong `app/constants/theme.ts` (cả `Colors.light` và `Colors.dark`).
- Dùng hook `useThemeColor` để lấy màu theo theme hiện tại.

## API Client
- Dùng shared Axios client từ `app/services/api-client.ts`.
- Client đã xử lý: auto bearer token, token refresh, platform-specific localhost.

## Modal/Popup Pattern
- Thay `Alert.alert` bằng custom React Native `Modal` component cho styling nhất quán.
- Modal backdrop: `rgba(0, 0, 0, 0.5)`.
- Auto-redirect dùng `setTimeout` → clear timer khi unmount để tránh memory leak.

# AI (Python FastAPI) Conventions

## Cross-platform
- KHÔNG dùng shell command phụ thuộc OS (`os.popen("date")`, v.v.).
- Dùng thư viện chuẩn Python: `datetime`, `pathlib`, `os.path`.
