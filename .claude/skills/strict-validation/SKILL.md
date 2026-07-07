---
name: strict-validation
description: "Trigger whenever modifying frontend forms, API clients, or UI components that send data to the backend. Enforces strict client-side validation that matches backend DTOs before any API calls are made."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
---

# Front-End Strict Validation Skill

## Khi nào kích hoạt
Rule này BẮT BUỘC áp dụng mỗi khi viết, thêm hoặc chỉnh sửa code ở frontend (`app/**/*.tsx`, `app/**/*.ts`) mà code đó **lấy dữ liệu từ user và gửi lên backend (API call)**.

## Quy trình bắt buộc

### Bước 1: Đọc backend DTO
Dùng `Grep` tìm DTO tương ứng trong `server/src/**/*.dto.ts`. Xác định tất cả validation decorator (`@IsEmail`, `@MinLength`, `@IsNotEmpty`, `@IsEnum`, `@MaxLength`, `@Matches`, v.v.).

### Bước 2: Kiểm tra frontend validation hiện tại
Đọc file form/component đang sửa. So sánh validation frontend với DTO backend.

### Bước 3: Đồng bộ validation
Mọi constraint ở backend DTO → frontend phải enforce tương tự TRƯỚC khi gọi API:
- `@IsEmail()` → regex email check
- `@MinLength(N)` → check `value.trim().length >= N`
- `@IsNotEmpty()` → check `value.trim() !== ''`
- `@IsEnum(E)` → check value nằm trong enum values
- `@MaxLength(N)` → check `value.length <= N`
- `@Matches(regex)` → check cùng regex

### Bước 4: Tự kiểm tra
Nếu phát hiện code gọi API (`apiClient.post`, `apiClient.put`, `fetch`, v.v.) mà KHÔNG có validation trước đó:
1. DỪNG lại
2. Thêm validation trước khi tiếp tục
3. Giải thích cho user những validation đã thêm

## Error display
- Hiển thị lỗi inline dưới mỗi field
- Disable submit button khi đang loading
- Clear error khi user bắt đầu sửa field
