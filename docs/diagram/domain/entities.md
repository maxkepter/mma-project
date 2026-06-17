# Entity Analysis — Hệ thống phân tích xổ số

> Phân tích từ Use Case Document

---

## Tổng quan Entity Map

| #   | Entity              | Module              | Liên quan UC           |
| --- | ------------------- | ------------------- | ---------------------- |
| 1   | User                | Auth                | Tất cả UC              |
| 2   | LotteryResult       | Core Data           | UC-01 → UC-10          |
| 3   | LotteryNumber       | Core Data           | UC-01 → UC-10          |
| 4   | FrequencyStatistic  | Statistics          | UC-01, UC-06           |
| 5   | GanStatistic        | Statistics          | UC-02, UC-06           |
| 6   | ConsecutiveLoss     | Statistics          | UC-03                  |
| 7   | HeadTailStatistic   | Statistics          | UC-04, UC-06           |
| 8   | NumberPairStatistic | Statistics          | UC-05, UC-06           |
| 9   | Heatmap             | Statistics          | UC-06                  |
| 10  | TrendAnalysis       | Analytics           | UC-07, UC-11           |
| 11  | CycleAnalysis       | Analytics           | UC-08                  |
| 12  | CorrelationAnalysis | Analytics           | UC-09                  |
| 13  | Prediction          | Analytics           | UC-10                  |
| 14  | AIInsight           | Analytics           | UC-11, UC-27, UC-28    |
| 15  | Strategy            | Strategy Management | UC-12 → UC-17          |
| 16  | StrategyCondition   | Strategy Management | UC-13                  |
| 17  | ConditionNode       | Strategy Management | UC-13 (condition tree) |
| 18  | BacktestRun         | Strategy Management | UC-14, UC-15           |
| 19  | BacktestResult      | Strategy Management | UC-15, UC-16           |
| 20  | BetEntry            | Betting Journal     | UC-18, UC-19           |
| 21  | BetPerformance      | Betting Journal     | UC-20                  |
| 22  | KnowledgeItem       | Knowledge Hub       | UC-21                  |
| 23  | NewsArticle         | News & Signals      | UC-24                  |
| 24  | Signal              | News & Signals      | UC-25                  |
| 25  | ChatConversation    | AI Assistant        | UC-26                  |
| 26  | ChatMessage         | AI Assistant        | UC-26                  |
| 27  | AIReport            | AI Assistant        | UC-28                  |

---

## Chi tiết từng Entity

---

### 1. User

> Module: **Auth** | Liên quan: Tất cả UC

| Attribute    | Type     | Description      |
| ------------ | -------- | ---------------- |
| id           | UUID     | Primary key      |
| email        | String   | Email đăng nhập  |
| passwordHash | String   | Mật khẩu đã hash |
| displayName  | String   | Tên hiển thị     |
| avatarUrl    | String?  | Ảnh đại diện     |
| role         | Enum     | USER, ADMIN      |
| createdAt    | DateTime | Ngày tạo         |
| updatedAt    | DateTime | Ngày cập nhật    |

---

### 2. LotteryResult

> Module: **Core Data** | Liên quan: UC-01 → UC-10 (nguồn dữ liệu gốc)

| Attribute | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | UUID     | Primary key           |
| drawDate  | Date     | Ngày xổ               |
| province  | String   | Đài / tỉnh            |
| region    | Enum     | NORTH, CENTRAL, SOUTH |
| createdAt | DateTime | Ngày import           |

**Relationship:** `1 LotteryResult → N LotteryNumber`

---

### 3. LotteryNumber

> Module: **Core Data** | Liên quan: UC-01 → UC-10

| Attribute     | Type   | Description                 |
| ------------- | ------ | --------------------------- |
| id            | UUID   | Primary key                 |
| resultId      | UUID   | FK → LotteryResult          |
| prizeLevel    | Enum   | SPECIAL, FIRST, ..., EIGHTH |
| number        | String | Số trúng (VD: "12345")      |
| lastTwoDigits | String | 2 số cuối (lô)              |
| position      | Int    | Vị trí trong giải           |

---

### 4. FrequencyStatistic

> Module: **Statistics** | Liên quan: UC-01, UC-06

| Attribute    | Type     | Description               |
| ------------ | -------- | ------------------------- |
| id           | UUID     | Primary key               |
| number       | String   | Số (00-99)                |
| frequency    | Int      | Số lần xuất hiện          |
| periodType   | Enum     | DAY, WEEK, MONTH, CUSTOM  |
| periodStart  | Date     | Bắt đầu khoảng thời gian  |
| periodEnd    | Date     | Kết thúc khoảng thời gian |
| region       | Enum     | NORTH, CENTRAL, SOUTH     |
| calculatedAt | DateTime | Thời điểm tính toán       |

---

### 5. GanStatistic

> Module: **Statistics** | Liên quan: UC-02, UC-06

| Attribute      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| id             | UUID     | Primary key                  |
| number         | String   | Số (00-99)                   |
| daysSinceLast  | Int      | Số ngày chưa xuất hiện (gan) |
| lastAppearDate | Date     | Ngày xuất hiện gần nhất      |
| maxGanHistory  | Int      | Gan lớn nhất lịch sử         |
| region         | Enum     | NORTH, CENTRAL, SOUTH        |
| calculatedAt   | DateTime | Thời điểm tính toán          |

---

### 6. ConsecutiveLoss (Lô rơi)

> Module: **Statistics** | Liên quan: UC-03

| Attribute       | Type   | Description                     |
| --------------- | ------ | ------------------------------- |
| id              | UUID   | Primary key                     |
| number          | String | Số lô                           |
| consecutiveDays | Int    | Số ngày rơi liên tiếp           |
| startDate       | Date   | Ngày bắt đầu rơi                |
| endDate         | Date?  | Ngày kết thúc (null = đang rơi) |
| region          | Enum   | NORTH, CENTRAL, SOUTH           |

---

### 7. HeadTailStatistic

> Module: **Statistics** | Liên quan: UC-04, UC-06

| Attribute    | Type     | Description               |
| ------------ | -------- | ------------------------- |
| id           | UUID     | Primary key               |
| digit        | Int      | Chữ số (0-9)              |
| type         | Enum     | HEAD, TAIL                |
| frequency    | Int      | Tần suất xuất hiện        |
| periodStart  | Date     | Bắt đầu khoảng thời gian  |
| periodEnd    | Date     | Kết thúc khoảng thời gian |
| region       | Enum     | NORTH, CENTRAL, SOUTH     |
| calculatedAt | DateTime | Thời điểm tính toán       |

---

### 8. NumberPairStatistic

> Module: **Statistics** | Liên quan: UC-05, UC-06

| Attribute     | Type     | Description                |
| ------------- | -------- | -------------------------- |
| id            | UUID     | Primary key                |
| numberA       | String   | Số thứ nhất                |
| numberB       | String   | Số thứ hai                 |
| pairType      | Enum     | REVERSE, CO_OCCUR, NOTABLE |
| coOccurrences | Int      | Số lần xuất hiện cùng nhau |
| periodStart   | Date     | Bắt đầu khoảng thời gian   |
| periodEnd     | Date     | Kết thúc khoảng thời gian  |
| region        | Enum     | NORTH, CENTRAL, SOUTH      |
| calculatedAt  | DateTime | Thời điểm tính toán        |

---

### 9. Heatmap

> Module: **Statistics** | Liên quan: UC-06

| Attribute   | Type     | Description                     |
| ----------- | -------- | ------------------------------- |
| id          | UUID     | Primary key                     |
| type        | Enum     | FREQUENCY, GAN, HEAD_TAIL, PAIR |
| data        | JSON     | Ma trận dữ liệu heatmap         |
| periodStart | Date     | Bắt đầu khoảng thời gian        |
| periodEnd   | Date     | Kết thúc khoảng thời gian       |
| region      | Enum     | NORTH, CENTRAL, SOUTH           |
| generatedAt | DateTime | Thời điểm sinh                  |

---

### 10. TrendAnalysis

> Module: **Analytics** | Liên quan: UC-07, UC-11

| Attribute      | Type     | Description           |
| -------------- | -------- | --------------------- |
| id             | UUID     | Primary key           |
| number         | String   | Số được phân tích     |
| trendDirection | Enum     | UP, DOWN, STABLE      |
| trendStrength  | Float    | Mức độ mạnh yếu (0-1) |
| periodStart    | Date     | Bắt đầu phân tích     |
| periodEnd      | Date     | Kết thúc phân tích    |
| dataPoints     | JSON     | Dữ liệu điểm xu hướng |
| region         | Enum     | NORTH, CENTRAL, SOUTH |
| analyzedAt     | DateTime | Thời điểm phân tích   |

---

### 11. CycleAnalysis

> Module: **Analytics** | Liên quan: UC-08

| Attribute        | Type     | Description                 |
| ---------------- | -------- | --------------------------- |
| id               | UUID     | Primary key                 |
| targetType       | Enum     | NUMBER, PAIR, HEAD_TAIL     |
| targetValue      | String   | Giá trị phân tích           |
| cycleLength      | Int      | Độ dài chu kỳ (ngày)        |
| confidence       | Float    | Độ tin cậy (0-1)            |
| nextExpectedDate | Date?    | Ngày dự kiến xuất hiện tiếp |
| region           | Enum     | NORTH, CENTRAL, SOUTH       |
| analyzedAt       | DateTime | Thời điểm phân tích         |

---

### 12. CorrelationAnalysis

> Module: **Analytics** | Liên quan: UC-09

| Attribute        | Type     | Description               |
| ---------------- | -------- | ------------------------- |
| id               | UUID     | Primary key               |
| entityAType      | Enum     | NUMBER, PAIR              |
| entityAValue     | String   | Giá trị A                 |
| entityBType      | Enum     | NUMBER, PAIR              |
| entityBValue     | String   | Giá trị B                 |
| correlationScore | Float    | Hệ số tương quan (-1 → 1) |
| sampleSize       | Int      | Số mẫu phân tích          |
| region           | Enum     | NORTH, CENTRAL, SOUTH     |
| analyzedAt       | DateTime | Thời điểm phân tích       |

---

### 13. Prediction

> Module: **Analytics** | Liên quan: UC-10

| Attribute       | Type     | Description               |
| --------------- | -------- | ------------------------- |
| id              | UUID     | Primary key               |
| predictedDate   | Date     | Ngày dự báo               |
| numbers         | JSON     | Danh sách số dự báo       |
| probabilities   | JSON     | Xác suất từng số          |
| confidenceLevel | Float    | Mức độ tin cậy tổng (0-1) |
| modelUsed       | String   | Mô hình AI sử dụng        |
| region          | Enum     | NORTH, CENTRAL, SOUTH     |
| createdAt       | DateTime | Thời điểm tạo dự báo      |

---

### 14. AIInsight

> Module: **Analytics / AI** | Liên quan: UC-11, UC-27, UC-28

| Attribute         | Type     | Description                                                 |
| ----------------- | -------- | ----------------------------------------------------------- |
| id                | UUID     | Primary key                                                 |
| userId            | UUID     | FK → User                                                   |
| type              | Enum     | TREND_EXPLAIN, PREDICTION_EXPLAIN, STRATEGY_REVIEW, GENERAL |
| title             | String   | Tiêu đề insight                                             |
| content           | Text     | Nội dung phân tích                                          |
| relatedEntityType | String?  | Loại entity liên quan                                       |
| relatedEntityId   | UUID?    | ID entity liên quan                                         |
| createdAt         | DateTime | Thời điểm tạo                                               |

---

### 15. Strategy

> Module: **Strategy Management** | Liên quan: UC-12 → UC-17

| Attribute        | Type     | Description                 |
| ---------------- | -------- | --------------------------- |
| id               | UUID     | Primary key                 |
| userId           | UUID     | FK → User                   |
| name             | String   | Tên chiến lược              |
| description      | Text?    | Mô tả                       |
| status           | Enum     | DRAFT, ACTIVE, ARCHIVED     |
| isAIGenerated    | Boolean  | Được tạo bởi AI?            |
| sourceStrategyId | UUID?    | FK → Strategy (nhân bản từ) |
| createdAt        | DateTime | Ngày tạo                    |
| updatedAt        | DateTime | Ngày cập nhật               |

**Relationship:** `1 Strategy → N StrategyCondition`

---

### 16. StrategyCondition

> Module: **Strategy Management** | Liên quan: UC-13

| Attribute     | Type   | Description                                           |
| ------------- | ------ | ----------------------------------------------------- |
| id            | UUID   | Primary key                                           |
| strategyId    | UUID   | FK → Strategy                                         |
| parentId      | UUID?  | FK → StrategyCondition (tree)                         |
| conditionType | Enum   | FREQUENCY, GAN, HEAD_TAIL, PAIR, TREND, CYCLE, CUSTOM |
| operator      | Enum   | GT, LT, EQ, GTE, LTE, BETWEEN, IN                     |
| value         | String | Giá trị so sánh                                       |
| logicOperator | Enum?  | AND, OR (nối với sibling)                             |
| order         | Int    | Thứ tự trong tree                                     |

---

### 17. ConditionNode

> Module: **Strategy Management** | Liên quan: UC-13 (condition tree)

| Attribute     | Type  | Description                   |
| ------------- | ----- | ----------------------------- |
| id            | UUID  | Primary key                   |
| strategyId    | UUID  | FK → Strategy                 |
| parentNodeId  | UUID? | FK → ConditionNode (self-ref) |
| nodeType      | Enum  | GROUP, CONDITION              |
| logicOperator | Enum? | AND, OR (cho GROUP)           |
| conditionId   | UUID? | FK → StrategyCondition        |
| order         | Int   | Thứ tự trong cùng level       |

> **Note:** `ConditionNode` và `StrategyCondition` có thể gộp thành 1 entity nếu dùng pattern Composite. Tách ra để rõ ràng hơn khi xây dựng condition tree phức tạp.

---

### 18. BacktestRun

> Module: **Strategy Management** | Liên quan: UC-14, UC-15

| Attribute   | Type      | Description                         |
| ----------- | --------- | ----------------------------------- |
| id          | UUID      | Primary key                         |
| strategyId  | UUID      | FK → Strategy                       |
| userId      | UUID      | FK → User                           |
| periodStart | Date      | Ngày bắt đầu backtest               |
| periodEnd   | Date      | Ngày kết thúc backtest              |
| status      | Enum      | PENDING, RUNNING, COMPLETED, FAILED |
| startedAt   | DateTime  | Thời điểm bắt đầu chạy              |
| completedAt | DateTime? | Thời điểm hoàn thành                |

**Relationship:** `1 BacktestRun → 1 BacktestResult`

---

### 19. BacktestResult

> Module: **Strategy Management** | Liên quan: UC-15, UC-16

| Attribute     | Type    | Description                 |
| ------------- | ------- | --------------------------- |
| id            | UUID    | Primary key                 |
| backtestRunId | UUID    | FK → BacktestRun            |
| totalBets     | Int     | Tổng số lần đánh            |
| wins          | Int     | Số lần thắng                |
| losses        | Int     | Số lần thua                 |
| winrate       | Float   | Tỷ lệ thắng (%)             |
| roi           | Float   | Return on Investment (%)    |
| totalProfit   | Decimal | Tổng lợi nhuận              |
| totalLoss     | Decimal | Tổng thua lỗ                |
| maxDrawdown   | Float   | Drawdown tối đa (%)         |
| details       | JSON    | Chi tiết từng ngày backtest |

---

### 20. BetEntry

> Module: **Betting Journal** | Liên quan: UC-18, UC-19

| Attribute  | Type     | Description                 |
| ---------- | -------- | --------------------------- |
| id         | UUID     | Primary key                 |
| userId     | UUID     | FK → User                   |
| betDate    | Date     | Ngày đánh                   |
| numbers    | JSON     | Danh sách số đánh           |
| amount     | Decimal  | Số tiền đặt                 |
| betType    | Enum     | LO, DE, XIEN, BAO_LO        |
| result     | Enum?    | WIN, LOSS, PENDING          |
| payout     | Decimal? | Tiền thắng (nếu có)         |
| note       | Text?    | Ghi chú                     |
| strategyId | UUID?    | FK → Strategy (nếu theo CL) |
| createdAt  | DateTime | Ngày tạo                    |
| updatedAt  | DateTime | Ngày cập nhật               |

---

### 21. BetPerformance

> Module: **Betting Journal** | Liên quan: UC-20

| Attribute     | Type     | Description                |
| ------------- | -------- | -------------------------- |
| id            | UUID     | Primary key                |
| userId        | UUID     | FK → User                  |
| periodType    | Enum     | DAY, WEEK, MONTH, ALL_TIME |
| periodStart   | Date     | Bắt đầu khoảng thời gian   |
| periodEnd     | Date     | Kết thúc khoảng thời gian  |
| totalBets     | Int      | Tổng số lần đánh           |
| wins          | Int      | Số lần thắng               |
| winrate       | Float    | Tỷ lệ thắng (%)            |
| roi           | Float    | ROI (%)                    |
| totalProfit   | Decimal  | Tổng lãi                   |
| totalLoss     | Decimal  | Tổng lỗ                    |
| netProfitLoss | Decimal  | Lãi/lỗ ròng                |
| maxDrawdown   | Float    | Drawdown tối đa (%)        |
| calculatedAt  | DateTime | Thời điểm tính toán        |

---

### 22. KnowledgeItem

> Module: **Knowledge Hub** | Liên quan: UC-21

| Attribute  | Type     | Description                            |
| ---------- | -------- | -------------------------------------- |
| id         | UUID     | Primary key                            |
| userId     | UUID     | FK → User                              |
| type       | Enum     | STATISTIC, STRATEGY, AI_ANALYSIS, NEWS |
| title      | String   | Tiêu đề                                |
| content    | Text?    | Nội dung tóm tắt                       |
| sourceType | String   | Loại nguồn gốc                         |
| sourceId   | UUID?    | ID nguồn gốc                           |
| tags       | JSON     | Tags phân loại                         |
| isFavorite | Boolean  | Đánh dấu yêu thích                     |
| createdAt  | DateTime | Ngày lưu                               |

---

### 23. NewsArticle

> Module: **News & Signals** | Liên quan: UC-24

| Attribute   | Type     | Description      |
| ----------- | -------- | ---------------- |
| id          | UUID     | Primary key      |
| title       | String   | Tiêu đề tin      |
| summary     | Text?    | Tóm tắt          |
| content     | Text     | Nội dung         |
| sourceUrl   | String?  | URL nguồn        |
| sourceName  | String   | Tên nguồn        |
| category    | Enum     | LOTTERY, GENERAL |
| imageUrl    | String?  | Ảnh minh họa     |
| publishedAt | DateTime | Ngày đăng        |
| createdAt   | DateTime | Ngày import      |

---

### 24. Signal

> Module: **News & Signals** | Liên quan: UC-25

| Attribute   | Type     | Description             |
| ----------- | -------- | ----------------------- |
| id          | UUID     | Primary key             |
| signalDate  | Date     | Ngày tín hiệu           |
| numbers     | JSON     | Danh sách số đề xuất    |
| source      | String   | Nguồn dữ liệu           |
| explanation | Text     | Giải thích cách sinh số |
| confidence  | Float?   | Độ tin cậy (0-1)        |
| region      | Enum     | NORTH, CENTRAL, SOUTH   |
| createdAt   | DateTime | Thời điểm tạo           |

---

### 25. ChatConversation

> Module: **AI Assistant** | Liên quan: UC-26

| Attribute | Type     | Description            |
| --------- | -------- | ---------------------- |
| id        | UUID     | Primary key            |
| userId    | UUID     | FK → User              |
| title     | String?  | Tiêu đề cuộc hội thoại |
| status    | Enum     | ACTIVE, ARCHIVED       |
| createdAt | DateTime | Ngày tạo               |
| updatedAt | DateTime | Tin nhắn cuối          |

**Relationship:** `1 ChatConversation → N ChatMessage`

---

### 26. ChatMessage

> Module: **AI Assistant** | Liên quan: UC-26

| Attribute      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| id             | UUID     | Primary key                  |
| conversationId | UUID     | FK → ChatConversation        |
| role           | Enum     | USER, ASSISTANT              |
| content        | Text     | Nội dung tin nhắn            |
| metadata       | JSON?    | Dữ liệu bổ sung (chart, ref) |
| createdAt      | DateTime | Thời điểm gửi                |

---

### 27. AIReport

> Module: **AI Assistant** | Liên quan: UC-28

| Attribute       | Type     | Description            |
| --------------- | -------- | ---------------------- |
| id              | UUID     | Primary key            |
| userId          | UUID     | FK → User              |
| reportType      | Enum     | DAILY, WEEKLY, MONTHLY |
| reportDate      | Date     | Ngày báo cáo           |
| title           | String   | Tiêu đề                |
| content         | Text     | Nội dung báo cáo       |
| highlights      | JSON     | Điểm nổi bật           |
| recommendations | JSON     | Đề xuất                |
| createdAt       | DateTime | Thời điểm tạo          |

---

## Sơ đồ quan hệ tổng quan

```
User ──┬── 1:N ──→ Strategy ──┬── 1:N ──→ StrategyCondition
       │                      ├── 1:N ──→ ConditionNode
       │                      └── 1:N ──→ BacktestRun ── 1:1 ──→ BacktestResult
       │
       ├── 1:N ──→ BetEntry
       ├── 1:N ──→ BetPerformance
       ├── 1:N ──→ KnowledgeItem
       ├── 1:N ──→ ChatConversation ── 1:N ──→ ChatMessage
       ├── 1:N ──→ AIInsight
       └── 1:N ──→ AIReport

LotteryResult ── 1:N ──→ LotteryNumber

FrequencyStatistic ─┐
GanStatistic ───────┤
ConsecutiveLoss ────┤  (derived from LotteryResult/LotteryNumber)
HeadTailStatistic ──┤
NumberPairStatistic ┤
Heatmap ────────────┘

TrendAnalysis ──────┐
CycleAnalysis ──────┤  (derived analytics)
CorrelationAnalysis ┤
Prediction ─────────┘

NewsArticle ────────── (external data)
Signal ─────────────── (derived from external source)
```

---

## Phân nhóm theo Bounded Context (DDD)

| Bounded Context  | Entities                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Identity**     | User                                                                                               |
| **Lottery Core** | LotteryResult, LotteryNumber                                                                       |
| **Statistics**   | FrequencyStatistic, GanStatistic, ConsecutiveLoss, HeadTailStatistic, NumberPairStatistic, Heatmap |
| **Analytics**    | TrendAnalysis, CycleAnalysis, CorrelationAnalysis, Prediction                                      |
| **Strategy**     | Strategy, StrategyCondition, ConditionNode, BacktestRun, BacktestResult                            |
| **Journal**      | BetEntry, BetPerformance                                                                           |
| **Knowledge**    | KnowledgeItem                                                                                      |
| **News**         | NewsArticle, Signal                                                                                |
| **AI**           | AIInsight, ChatConversation, ChatMessage, AIReport                                                 |
