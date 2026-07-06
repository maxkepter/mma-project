import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';
import { PrizeLevel } from '../lottery-core/entities/prize-level.enum';
import {
  FrequencyItemDto,
  GanItemDto,
  LoRoiItemDto,
  HeadTailResponseDto,
  HeadTailItemDto,
  NumberPairItemDto,
  HeatmapResponseDto,
  HeatmapRowDto,
  HeatmapCellDto,
} from './dto/statistics-response.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(LotteryResult)
    private readonly lotteryResultRepo: Repository<LotteryResult>,
  ) {}

  /**
   * UC-01: Xem thống kê tần suất
   * Tính tần suất xuất hiện của các số lô (00-99) trong khoảng kỳ quay.
   * Lấy 2 số cuối của mỗi giải, đếm số lần xuất hiện.
   */
  async getFrequency(
    limit: number = 100,
    prizeLevels?: PrizeLevel[],
  ): Promise<FrequencyItemDto[]> {
    const draws = await this.getRecentDraws(limit);

    // Dem tan suat cho 00-99
    const freqMap = new Map<string, number>();
    for (let i = 0; i < 100; i++) {
      freqMap.set(i.toString().padStart(2, '0'), 0);
    }

    for (const draw of draws) {
      for (const num of draw.numbers) {
        if (prizeLevels && prizeLevels.length > 0) {
          if (!prizeLevels.includes(num.prizeLevel)) continue;
        }
        const loto = num.value.slice(-2);
        freqMap.set(loto, (freqMap.get(loto) ?? 0) + 1);
      }
    }

    const total =
      draws.length * (prizeLevels?.length ?? draws[0]?.numbers?.length ?? 27);

    const items: FrequencyItemDto[] = Array.from(freqMap.entries()).map(
      ([number, count]) => ({
        number,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
        rank: 0,
      }),
    );

    // Sort by count desc, assign rank
    items.sort((a, b) => b.count - a.count);
    items.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return items;
  }

  /**
   * UC-02: Xem thống kê số gan
   * Tính số ngày gan (vắng mặt) cho từng số lô.
   * Duyệt du lieu theo thu tu thoi gian tang dan, dem so ngay vang mat.
   */
  async getGan(limit: number = 1000): Promise<GanItemDto[]> {
    const draws = await this.getRecentDraws(limit, true);

    const absentCounters = new Array<number>(100).fill(0);
    const maxGan = new Array<number>(100).fill(0);
    const lastSeen = new Array<string | null>(100).fill(null);

    for (const draw of draws) {
      const present = new Set<string>();

      for (const num of draw.numbers) {
        present.add(num.value.slice(-2));
      }

      // Cap nhat gan cho nhung so chua xuat hien hom nay
      for (let i = 0; i < 100; i++) {
        const numStr = i.toString().padStart(2, '0');
        if (present.has(numStr)) {
          // Cap nhat max gan neu can
          if (absentCounters[i] > maxGan[i]) {
            maxGan[i] = absentCounters[i];
          }
          absentCounters[i] = 0;
          lastSeen[i] =
            draw.date instanceof Date
              ? draw.date.toISOString().split('T')[0]
              : String(draw.date);
        } else {
          absentCounters[i]++;
        }
      }
    }

    // Sau loop, cap nhat maxGan cho cac so van dang vang mat
    return Array.from({ length: 100 }, (_, i) => {
      const numStr = i.toString().padStart(2, '0');
      const currentGan = absentCounters[i];
      const effectiveMaxGan = Math.max(maxGan[i], currentGan);
      return {
        number: numStr,
        currentGan,
        maxGan: effectiveMaxGan,
        lastSeenDate: lastSeen[i],
      };
    });
  }

  /**
   * UC-03: Xem thống kê lô rơi
   * Lô rơi từ đề: 2 số cuối giải đặc biệt ngày trước xuất hiện ở bất kỳ giải nào hôm nay.
   * Lô rơi từ lô: số lô ngày trước xuất hiện lại hôm nay.
   */
  async getLoRoi(limit: number = 30): Promise<LoRoiItemDto[]> {
    const draws = await this.getRecentDraws(limit, true);

    const results: LoRoiItemDto[] = [];

    for (let i = 1; i < draws.length; i++) {
      const current = draws[i];
      const previous = draws[i - 1];

      // Lay 2 so cuoi giai dac biet ngay truoc
      const prevSpecial = previous.numbers.find(
        (n) => n.prizeLevel === PrizeLevel.Special,
      );
      const prevSpecialLoto = prevSpecial?.value.slice(-2) ?? '';

      // Lay tat ca loto ngay truoc
      const prevLotos = new Set(previous.numbers.map((n) => n.value.slice(-2)));

      // Lay tat ca loto hom nay
      const currLotos = new Set(current.numbers.map((n) => n.value.slice(-2)));

      // Lo roi tu de
      const loRoiTuDe =
        prevSpecialLoto && currLotos.has(prevSpecialLoto)
          ? [prevSpecialLoto]
          : [];

      // Lo roi tu lo
      const loRoiTuLo: string[] = [];
      prevLotos.forEach((loto) => {
        if (loto !== prevSpecialLoto && currLotos.has(loto)) {
          loRoiTuLo.push(loto);
        }
      });

      if (loRoiTuDe.length > 0 || loRoiTuLo.length > 0) {
        results.push({
          date:
            current.date instanceof Date
              ? current.date.toISOString().split('T')[0]
              : String(current.date),
          specialLoto: prevSpecialLoto,
          loRoiTuDe,
          loRoiTuLo,
        });
      }
    }

    return results;
  }

  /**
   * UC-04: Xem thống kê đầu đuôi
   * Đầu = chữ số hàng chục (0-9), Đuôi = chữ số hàng đơn vị (0-9).
   */
  async getHeadTail(limit: number = 100): Promise<HeadTailResponseDto> {
    const draws = await this.getRecentDraws(limit);

    const headCounts = new Array<number>(10).fill(0);
    const tailCounts = new Array<number>(10).fill(0);

    for (const draw of draws) {
      for (const num of draw.numbers) {
        const loto = num.value.slice(-2);
        const head = parseInt(loto[0], 10);
        const tail = parseInt(loto[1], 10);
        headCounts[head]++;
        tailCounts[tail]++;
      }
    }

    const total = draws.length * 27;

    const toItems = (counts: number[]): HeadTailItemDto[] =>
      counts.map((count, digit) => ({
        digit,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));

    return {
      heads: toItems(headCounts),
      tails: toItems(tailCounts),
    };
  }

  /**
   * UC-05: Xem thống kê cặp số
   * Dem so lan 2 so xuat hien cung nhau trong cung mot ky quay.
   */
  async getNumberPairs(limit: number = 100): Promise<NumberPairItemDto[]> {
    const draws = await this.getRecentDraws(limit);

    const pairMap = new Map<string, number>();
    const pairSet = new Set<string>();

    for (const draw of draws) {
      // Lay danh sach loto unique trong ngay
      const uniqueLotos = [
        ...new Set(draw.numbers.map((n) => n.value.slice(-2))),
      ];
      pairSet.clear();

      // Tat ca cap (ke ca cap dao)
      for (let i = 0; i < uniqueLotos.length; i++) {
        for (let j = i + 1; j < uniqueLotos.length; j++) {
          const a = uniqueLotos[i];
          const b = uniqueLotos[j];
          pairSet.add(`${a}-${b}`);
        }
      }

      // Tang so lan xuat hien
      for (const pair of pairSet) {
        pairMap.set(pair, (pairMap.get(pair) ?? 0) + 1);
      }
    }

    const total = draws.length;

    const items: NumberPairItemDto[] = Array.from(pairMap.entries())
      .map(([pairStr, count]) => ({
        pair: pairStr.split('-'),
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); // Chi tra ve top 100

    return items;
  }

  /**
   * UC-06: Xem heatmap
   * Ma tran 10x10 (hang = dau 0-9, cot = duoi 0-9).
   */
  async getHeatmap(
    limit: number = 100,
    mode: 'frequency' | 'gan' = 'frequency',
  ): Promise<HeatmapResponseDto> {
    const rows: HeatmapRowDto[] = [];

    if (mode === 'frequency') {
      const freq = await this.getFrequency(limit);

      for (let head = 0; head < 10; head++) {
        const cells: HeatmapCellDto[] = [];
        for (let tail = 0; tail < 10; tail++) {
          const number = `${head}${tail}`;
          const item = freq.find((f) => f.number === number);
          const value = item?.count ?? 0;
          cells.push({
            number,
            value,
            intensity: 0, // se tinh o frontend
          });
        }
        rows.push({ head, cells });
      }
    } else {
      const gan = await this.getGan(limit);

      for (let head = 0; head < 10; head++) {
        const cells: HeatmapCellDto[] = [];
        for (let tail = 0; tail < 10; tail++) {
          const number = `${head}${tail}`;
          const item = gan.find((g) => g.number === number);
          const value = item?.currentGan ?? 0;
          cells.push({
            number,
            value,
            intensity: 0,
          });
        }
        rows.push({ head, cells });
      }
    }

    return { mode, rows };
  }

  // --- Private helpers ---

  /**
   * Lay N ky quay gan nhat, sap xep tu moi nhat den cu nhat.
   * Neu ascending=true, tra ve cung danh sach nhung sap xep cu nhat den moi nhat (dung cho tinh gan/lo roi).
   *
   * Logic:
   * 1. Lay tat ca draws, sap xep DESC theo date (uu tien ngay moi nhat).
   * 2. Sau do neu can ASC, dao nguoc danh sach.
   *
   * Dam bao dung ca khi date trong DB luu duoi dang string khong sort dung.
   */
  private async getRecentDraws(
    limit: number,
    ascending: boolean = false,
  ): Promise<LotteryResult[]> {
    const draws = await this.lotteryResultRepo.find({
      relations: ['numbers'],
      order: { date: 'DESC' },
      take: limit,
    });

    // Sort in JS to ensure correct order regardless of DB driver or mock behavior
    draws.sort((a, b) => {
      const timeA =
        a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const timeB =
        b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return timeB - timeA; // Descending (newest first)
    });

    if (ascending) {
      return draws.reverse();
    }
    return draws;
  }
}
