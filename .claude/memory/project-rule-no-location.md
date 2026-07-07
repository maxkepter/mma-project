---
name: project-rule-no-location
description: Mọi rule bảo thêm vào project phải mặc định đặt ở project root nếu không có vị trí cụ thể được chỉ định
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0085fc07-6d3d-4379-b66c-cfeba9d54b63
---

Khi người dùng yêu cầu "thêm rule" / "thêm quy tắc" cho project mà không chỉ rõ vị trí file, mặc định đặt ở project root (ví dụ `d:\SE\class\mma\mma-project\`).

Không tự ý chọn ngẫu nhiên một file trong `app/` hay `server/` hay bất kỳ workspace con nào. Nếu không chắc, hỏi lại.

**Why:** Người dùng phát biểu: "từ nay chở đi, mỗi khi tôi bảo thêm rule không có yêu vị trí cụ thể nào mặc định cho ở project" (đã ghi lúc thêm rule về NestJS JWT guard nhưng lại nhầm vào .claude/memory).
**How to apply:** Mọi lần nhận yêu cầu "thêm rule" mơ hồ về vị trí, đặt ở project root trước. Hỏi nếu cần rõ hơn.