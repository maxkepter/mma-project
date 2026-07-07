---
name: nestjs-module
description: "Trigger when creating a new NestJS module/controller/service. Enforces project conventions: no @UseGuards(JwtAuthGuard), correct TypeORM patterns, DTO validation, and module structure."
argument-hint: "[module-name]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# NestJS Module Creation Skill

## Khi nào kích hoạt
Khi tạo mới hoặc sửa module, controller, service, entity trong `server/src/`.

## Checklist bắt buộc

### Controller
- [ ] KHÔNG có `@UseGuards(JwtAuthGuard)` — guard đã global qua `APP_GUARD`
- [ ] Route công khai dùng `@Public()` từ `server/src/auth/decorators/public.decorator.ts`
- [ ] Inject service qua constructor, KHÔNG inject repository trực tiếp
- [ ] Dùng `@CurrentUser()` decorator để lấy user từ JWT (nếu có)

### Entity
- [ ] PK dùng `@PrimaryGeneratedColumn('uuid')`
- [ ] `@OneToMany` với `cascade: true` → thêm `orphanedRowAction: 'delete'` nếu child có thể bị thay thế
- [ ] User-owned entity phải có `userId` FK
- [ ] Timestamps: `@CreateDateColumn()` và `@UpdateDateColumn()`

### DTO
- [ ] Dùng `class-validator` decorators (`@IsString`, `@IsNotEmpty`, `@IsOptional`, v.v.)
- [ ] Query number params dùng `@Transform(({ value }) => parseInt(value, 10))`
- [ ] Export DTO để frontend skill có thể đọc và đồng bộ validation

### Module
- [ ] Đăng ký entity qua `TypeOrmModule.forFeature([Entity])`
- [ ] Export `TypeOrmModule` nếu entity cần được dùng ở module khác
- [ ] KHÔNG import `AuthModule` (không cần vì guard đã global)
- [ ] Import vào `AppModule`

### Service
- [ ] Inject repository qua `@InjectRepository(Entity)`
- [ ] Throw `NotFoundException` khi entity không tìm thấy
- [ ] Đường dẫn file: dùng `__dirname`, KHÔNG dùng `process.cwd()`

## Module structure template
```
server/src/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.controller.spec.ts
├── <module-name>.service.ts
├── <module-name>.service.spec.ts
├── dto/
│   ├── create-<module-name>.dto.ts
│   └── update-<module-name>.dto.ts
└── entities/
    └── <module-name>.entity.ts
```
