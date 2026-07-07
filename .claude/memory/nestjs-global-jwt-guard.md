---
name: nestjs-global-jwt-guard
description: "NestJS JWT auth guard rule — never redeclare JwtAuthGuard on controllers when it's already global via APP_GUARD"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0085fc07-6d3d-4379-b66c-cfeba9d54b63
---

Trong repo này, `JwtAuthGuard` đã được đăng ký global qua `APP_GUARD` trong `server/src/app.module.ts`. Khi thêm controller mới cho bất kỳ module nào, KHÔNG được thêm `@UseGuards(JwtAuthGuard)` lên class controller.

Lý do: Nest cố resolve `JwtService` trong scope module hiện tại khi instantiate guard. Module không import `AuthModule` → lỗi `UnknownDependenciesException: Nest can't resolve dependencies of the JwtAuthGuard`.

Đúng:
- Không khai báo `@UseGuards` ở controller.
- Muốn public endpoint thì dùng `@Public()` từ `server/src/auth/decorators/public.decorator.ts`.

Sai (gây lỗi):
```ts
@UseGuards(JwtAuthGuard)
@Controller('foo')
export class FooController {}
```

**Why:** Đã từng chạy runtime NestJS bị crash vì lỗi trên khi thêm controller cho Strategy module.
**How to apply:** Khi viết controller Nest mới ở server, bỏ qua `@UseGuards(JwtAuthGuard)` và chỉ dùng `@Public()` khi cần mở khóa route.