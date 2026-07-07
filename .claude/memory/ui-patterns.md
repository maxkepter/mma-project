---
name: ui-patterns
description: "Các pattern UI/UX đã thiết lập trong app — áp dụng khi tạo/sửa screen mới"
metadata:
  node_type: memory
  type: project
---

# UI Patterns đã thiết lập

## 1. Success Modal (thay Alert.alert)
Dùng custom `Modal` component thay vì `Alert.alert` cho feedback thành công.

Pattern:
- Backdrop: `rgba(0, 0, 0, 0.5)`
- Icon: `MaterialIcons` checkmark màu xanh lá
- Button chính: CTA rõ ràng (ví dụ: "Đăng nhập ngay")
- Auto-redirect: `setTimeout` 3 giây → clear timer khi unmount hoặc khi user bấm button

Đã áp dụng tại: `app/app/(auth)/register.tsx`

## 2. Form Validation Pattern
- Validate inline trước khi gọi API (trim, regex, length check)
- Hiển thị lỗi inline dưới mỗi field
- Disable button khi đang loading
- Tất cả rule phải đồng bộ với backend DTO

## 3. Auth Flow
- `_layout.tsx` check `AuthContext` → redirect unauthenticated users đến `/login`
- Token lưu trong `expo-secure-store` qua `TokenStorage`
- Axios interceptor tự động attach bearer token + xử lý refresh token khi 401

## 4. Theme-aware Components
- Dùng `ThemedText`, `ThemedView` cho text/view tự động theo theme
- Lấy màu qua `useThemeColor` hook
- Tất cả màu phải được khai báo trong cả `Colors.light` và `Colors.dark`
