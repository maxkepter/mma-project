---
name: known-bugs
description: "Các bug đã phát hiện trong codebase — cần lưu ý khi chạm vào code liên quan"
metadata:
  node_type: memory
  type: project
---

# Known Bugs

## 1. Redundant @UseGuards trên một số controller
**Vị trí:** `AnalyticsController`, `StatisticsController`, `AIController`
**Vấn đề:** Khai báo `@UseGuards(JwtAuthGuard)` thừa (guard đã global). Tạo coupling không cần thiết, buộc module import `AuthModule`.
**Fix:** Xóa `@UseGuards(JwtAuthGuard)` khỏi các controller này.

## 2. Orphaned StrategyCondition records
**Vị trí:** `server/src/strategy/entities/strategy.entity.ts`
**Vấn đề:** `@OneToMany(() => StrategyCondition, ..., { cascade: true })` thiếu `orphanedRowAction: 'delete'`. Khi update strategy bằng cách gán lại mảng conditions, các condition cũ bị xóa khỏi mảng nhưng vẫn tồn tại trong DB.
**Fix:** Thêm `orphanedRowAction: 'delete'` vào relation options.

## 3. process.cwd() trong data.download.ts
**Vị trí:** `server/src/jobs/data.download.ts`
**Vấn đề:** `path.join(process.cwd(), 'src', 'data', 'raw')` — khi chạy từ monorepo root, `process.cwd()` trả về root thay vì `server/`, gây lỗi đường dẫn.
**Fix:** Thay bằng `path.resolve(__dirname, '..', 'data', 'raw')`.

## 4. colors.border chưa tồn tại trong theme
**Vị trí:** Các file trong `app/app/stats/` reference `colors.border`
**Vấn đề:** `Colors.light` và `Colors.dark` trong `app/constants/theme.ts` không có key `border` → resolve thành `undefined` → border bị trong suốt.
**Fix:** Thêm `border` vào cả `Colors.light` và `Colors.dark` trong theme.ts.

## 5. SafeAreaView import không nhất quán ở stats screens
**Vị trí:** `app/app/stats/*.tsx`
**Vấn đề:** Import `SafeAreaView` trực tiếp từ `react-native-safe-area-context` thay vì dùng custom `SafeView` component.
**Fix:** Thay bằng `SafeView` từ `app/components/safe-view.tsx`.

## 6. os.popen("date") trong AI service
**Vị trí:** `ai/main.py` — endpoint `/chat`
**Vấn đề:** `os.popen("date")` trên Windows chạy lệnh `date` interactive → block process.
**Fix:** Thay bằng `datetime.datetime.now().isoformat()`.
