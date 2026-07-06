---
name: strict-validation
description: "Trigger whenever modifying frontend forms, API clients, or UI components that send data to the backend. Enforces strict client-side validation that matches backend DTOs before any API calls are made."
---

# Front-End Validation Rule

## Tình huống bắt buộc
Rule này BẮT BUỘC áp dụng mỗi khi bạn viết, thêm hoặc chỉnh sửa code ở frontend (ví dụ: `app/**/*.tsx`, `.ts`) mà code đó **lấy dữ liệu từ user và chuẩn bị gửi lên backend (API call)**.

## Quy tắc (Rule)
1. **Đồng bộ với Backend**: Frontend phải validate data nghiêm ngặt theo chuẩn DTO của backend (ví dụ `server/src/**/*.dto.ts`). Nếu backend quy định `@MinLength(6)`, `@IsEmail`, frontend cũng phải bắt lỗi y hệt.
2. **Ngăn chặn từ xa**: Mọi request API đều PHẢI nằm sau một lớp kiểm tra validation (ví dụ gọi `validateForm()`, hoặc schema validation như `Zod`, `Yup`).
3. **Rollback & Điều chỉnh**: Nếu bạn (Claude) lỡ viết code gọi API (`apiClient.post`, `fetch`, `register(`, v.v.) mà quên KHÔNG thực hiện validation trước đó:
   - Tự nhận ra lỗi và **TỰ ĐỘNG ROLLBACK** đoạn code vừa viết bằng các tool chỉnh sửa hoặc lệnh Git (`git checkout -- <file>`).
   - Dừng việc gọi API lại.
   - Trình bày lại hướng làm với User, ưu tiên việc tạo file schema dùng chung (shared schema) hoặc cập nhật UI để validate dữ liệu triệt để trước khi đi tiếp.

## Hành động ngay lập tức
- Khi skill này được kích hoạt, hãy dùng tool `Read` hoặc `Grep` để đọc DTO ở backend tương ứng với chức năng bạn đang làm.
- Xác minh lại logic UI hiện tại xem đã có validation chuẩn chưa. Nếu thiếu, bắt buộc cập nhật validation UI trước.
