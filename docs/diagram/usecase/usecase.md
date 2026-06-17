# Use Case Diagram — Hệ thống phân tích xổ số

---

## 1. Statistics

### UC-01 — Xem thống kê tần suất

**Actor:** User

- Xem tần suất từng số
- Xem tần suất theo khoảng thời gian
- Lọc theo ngày / tháng

### UC-02 — Xem thống kê số gan

**Actor:** User

- Xem số lâu chưa xuất hiện
- Xem số gan nhiều nhất
- Xem lịch sử xuất hiện

### UC-03 — Xem thống kê lô rơi

**Actor:** User

- Xem lô rơi
- Xem chuỗi lô rơi

### UC-04 — Xem thống kê đầu đuôi

**Actor:** User

- Xem đầu nổi bật
- Xem đuôi nổi bật
- Xem phân bố đầu đuôi

### UC-05 — Xem thống kê cặp số

**Actor:** User

- Xem cặp đảo
- Xem cặp xuất hiện cùng nhau
- Xem cặp nổi bật

### UC-06 — Xem heatmap

**Actor:** User

- Heatmap tần suất
- Heatmap số gan
- Heatmap đầu đuôi
- Heatmap cặp số

---

## 2. Analytics & Prediction

### UC-07 — Phân tích xu hướng

**Actor:** User

- Xem xu hướng tăng
- Xem xu hướng giảm
- Xem xu hướng theo thời gian

### UC-08 — Phân tích chu kỳ

**Actor:** User

- Chu kỳ số
- Chu kỳ cặp
- Chu kỳ đầu đuôi

### UC-09 — Phân tích tương quan

**Actor:** User

- Mối liên hệ giữa các số
- Mối liên hệ giữa các cặp

### UC-10 — Xem dự báo

**Actor:** User

- Xem số được dự báo
- Xem xác suất xuất hiện
- Xem mức độ tin cậy

### UC-11 — Nhận phân tích AI

**Actor:** User

- Giải thích xu hướng
- Giải thích dự báo
- Nhận insight

---

## 3. Strategy Management

### UC-12 — Quản lý chiến lược

**Actor:** User

- Tạo chiến lược
- Sửa chiến lược
- Xóa chiến lược
- Nhân bản chiến lược

### UC-13 — Xây dựng điều kiện chiến lược

**Actor:** User

- Thêm điều kiện
- Sửa điều kiện
- Tạo condition tree

### UC-14 — Backtest chiến lược

**Actor:** User

- Chọn khoảng thời gian
- Chạy backtest
- Xem kết quả

### UC-15 — Phân tích kết quả backtest

**Actor:** User

- Winrate
- ROI
- Profit / Loss
- Drawdown

### UC-16 — So sánh chiến lược

**Actor:** User

- So sánh ROI
- So sánh Winrate
- So sánh Drawdown

### UC-17 — Sinh chiến lược bằng AI

**Actor:** User

- Tạo chiến lược từ mô tả
- Tối ưu chiến lược
- Đề xuất rule

---

## 4. Betting Journal

### UC-18 — Ghi nhật ký đánh

**Actor:** User

- Ghi số đánh
- Ghi số tiền
- Ghi ngày

### UC-19 — Quản lý nhật ký đánh

**Actor:** User

- Xem lịch sử
- Chỉnh sửa
- Xóa

### UC-20 — Theo dõi hiệu suất cá nhân

**Actor:** User

- Winrate
- ROI
- Tổng lãi lỗ
- Drawdown

---

## 5. Knowledge Hub

### UC-21 — Lưu tri thức

**Actor:** User

- Lưu thống kê
- Lưu chiến lược
- Lưu phân tích AI
- Lưu tin tức

---

## 6. News & Signals

### UC-24 — Xem tin tức

**Actor:** User

- Xem tin tức xổ số
- Xem tin tổng hợp

### UC-25 — Xem tín hiệu từ dữ liệu người mất

**Actor:** User

- Xem danh sách số đề xuất
- Xem giải thích cách sinh số

---

## 7. AI Assistant

### UC-26 — Trao đổi với AI Assistant

**Actor:** User

- Đặt câu hỏi
- Nhận câu trả lời
- Hỏi về dữ liệu

**Ví dụ:**

> - Vì sao chiến lược A thua tháng 5?
> - Số nào đang có xu hướng tăng?
> - Những cặp nào nổi bật gần đây?

### UC-27 — Phân tích chiến lược bằng AI

**Actor:** User

- Đánh giá chiến lược
- Tìm điểm yếu
  Đề xuất cải tiến

UC-28 Tạo báo cáo AI

Actor: User

Báo cáo ngày
Báo cáo tuần
Báo cáo tháng
