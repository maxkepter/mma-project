---
name: rule-compliance-check
description: Trước khi thêm rule mới, kiểm tra các hành động đã làm có vi phạm các rule hiện có không; nếu có thì rollback rồi thực hiện lại.
metadata:
  type: feedback
---

Khi user yêu cầu thêm rule / memory / requirement mới, BẮT BUỘC thực hiện theo trình tự:

1. **Liệt kê các rule hiện hành** đã có (đọc các file `.claude/*.md` trong project).
2. **Kiểm tra các hành động đã làm trong turn hiện tại (và gần nhất)** có vi phạm rule hiện hành không.
3. **Nếu phát hiện vi phạm**: rollback (undo / xóa / sửa) rồi mới thêm rule mới.
4. **Nếu không vi phạm**: tiến hành thêm rule như yêu cầu, đúng vị trí theo rule hiện hành (vd `.claude/` trong project, không ra ngoài `C:\Users\...`).

**Why:** User muốn rule được áp dụng nhất quán và tức thì; việc vừa vi phạm rule cũ vừa thêm rule mới mà không tự nhận ra/không sửa sẽ khiến rule mất ý nghĩa và lặp lại lỗi.

**How to apply:** Mỗi lần nghe câu kiểu "thêm rule", "thêm memory", "quy tắc mới", "từ nay..." — dừng lại, audit các file đã ghi trong turn này và các turn ngay trước, so với rule hiện có. Có vi phạm → xử lý trước. Không có → mới thêm.
