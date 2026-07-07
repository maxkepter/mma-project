---
name: env-example-sync
description: Khi thêm biến môi trường / cờ tính năng mới, phải đồng thời thêm vào .env.example
metadata:
  type: feedback
---

Khi thêm biến môi trường mới (`process.env.*`, `EXPO_PUBLIC_*`) hoặc cờ tính năng dạng hằng số trong code (vd `DEV_MODE = true/false`), PHẢI đồng thời cập nhật `.env.example` (cả workspace `app/` lẫn `server/` nếu có).

**Why:** Người dùng không muốn thấy biến env mới được dùng trong code mà thiếu trong `.env.example` — vì dev mới onboard hoặc CI không biết phải khai báo giá trị nào, dẫn đến lỗi runtime im lặng.

**How to apply:** Mỗi lần thêm hằng env-backed hoặc switch feature flag, ngay trong cùng turn đó Edit file `.env.example` liên quan để thêm biến tương ứng (kèm comment giải thích). Tốt nhất là đọc `process.env.X` thay vì hard-code `true/false` trong code, rồi ghi vào `.env.example` giá trị mặc định.
