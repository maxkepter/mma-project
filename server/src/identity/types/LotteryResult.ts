export interface LotteryResult {
  date: string; // Định dạng ISO string "2005-10-01T00:00:00.000"
  special: number; // Giải đặc biệt
  prize1: number; // Giải nhất

  // Giải nhì (2 giải)
  prize2_1: number;
  prize2_2: number;

  // Giải ba (6 giải)
  prize3_1: number;
  prize3_2: number;
  prize3_3: number;
  prize3_4: number;
  prize3_5: number;
  prize3_6: number;

  // Giải tư (4 giải)
  prize4_1: number;
  prize4_2: number;
  prize4_3: number;
  prize4_4: number;

  // Giải năm (6 giải)
  prize5_1: number;
  prize5_2: number;
  prize5_3: number;
  prize5_4: number;
  prize5_5: number;
  prize5_6: number;

  // Giải sáu (3 giải)
  prize6_1: number;
  prize6_2: number;
  prize6_3: number;

  // Giải bảy (4 giải)
  prize7_1: number;
  prize7_2: number;
  prize7_3: number;
  prize7_4: number;
}
