/**
 * Script migrate dữ liệu xổ số từ JSON raw vào database
 *
 * Cách chạy:
 *   npx ts-node scripts/migrate-lottery.ts migrate [--2d] [--batch N] [--dry-run]
 *   npx ts-node scripts/migrate-lottery.ts stats
 *   npx ts-node scripts/migrate-lottery.ts clear --confirm
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { LotteryResult } from '../src/lottery-core/entities/lottery-result.entity';
import { LotteryNumber } from '../src/lottery-core/entities/lottery-number.entity';
import { PrizeLevel } from '../src/lottery-core/entities/prize-level.enum';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface RawLotteryResult {
  date: string;
  special: number;
  prize1: number;
  prize2_1: number;
  prize2_2: number;
  prize3_1: number;
  prize3_2: number;
  prize3_3: number;
  prize3_4: number;
  prize3_5: number;
  prize3_6: number;
  prize4_1: number;
  prize4_2: number;
  prize4_3: number;
  prize4_4: number;
  prize5_1: number;
  prize5_2: number;
  prize5_3: number;
  prize5_4: number;
  prize5_5: number;
  prize5_6: number;
  prize6_1: number;
  prize6_2: number;
  prize6_3: number;
  prize7_1: number;
  prize7_2: number;
  prize7_3: number;
  prize7_4: number;
}

interface PrizeMapping {
  field: keyof RawLotteryResult;
  level: PrizeLevel;
  position: number;
}

const prizeMappings: PrizeMapping[] = [
  { field: 'special', level: PrizeLevel.Special, position: 1 },
  { field: 'prize1', level: PrizeLevel.First, position: 1 },
  { field: 'prize2_1', level: PrizeLevel.Second, position: 1 },
  { field: 'prize2_2', level: PrizeLevel.Second, position: 2 },
  { field: 'prize3_1', level: PrizeLevel.Third, position: 1 },
  { field: 'prize3_2', level: PrizeLevel.Third, position: 2 },
  { field: 'prize3_3', level: PrizeLevel.Third, position: 3 },
  { field: 'prize3_4', level: PrizeLevel.Third, position: 4 },
  { field: 'prize3_5', level: PrizeLevel.Third, position: 5 },
  { field: 'prize3_6', level: PrizeLevel.Third, position: 6 },
  { field: 'prize4_1', level: PrizeLevel.Fourth, position: 1 },
  { field: 'prize4_2', level: PrizeLevel.Fourth, position: 2 },
  { field: 'prize4_3', level: PrizeLevel.Fourth, position: 3 },
  { field: 'prize4_4', level: PrizeLevel.Fourth, position: 4 },
  { field: 'prize5_1', level: PrizeLevel.Fifth, position: 1 },
  { field: 'prize5_2', level: PrizeLevel.Fifth, position: 2 },
  { field: 'prize5_3', level: PrizeLevel.Fifth, position: 3 },
  { field: 'prize5_4', level: PrizeLevel.Fifth, position: 4 },
  { field: 'prize5_5', level: PrizeLevel.Fifth, position: 5 },
  { field: 'prize5_6', level: PrizeLevel.Fifth, position: 6 },
  { field: 'prize6_1', level: PrizeLevel.Sixth, position: 1 },
  { field: 'prize6_2', level: PrizeLevel.Sixth, position: 2 },
  { field: 'prize6_3', level: PrizeLevel.Sixth, position: 3 },
  { field: 'prize7_1', level: PrizeLevel.Seventh, position: 1 },
  { field: 'prize7_2', level: PrizeLevel.Seventh, position: 2 },
  { field: 'prize7_3', level: PrizeLevel.Seventh, position: 3 },
  { field: 'prize7_4', level: PrizeLevel.Seventh, position: 4 },
];

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'raw');

// Khởi tạo DataSource
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'mma_db',
  entities: [LotteryResult, LotteryNumber],
  synchronize: false,
  logging: false,
});

function parseArgs(): { command: string; options: Record<string, any> } {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'stats';
  const options: Record<string, any> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--2d') options.file = 'xsmb-2-digits.json';
    if (arg === '--batch') options.batchSize = parseInt(args[++i], 10);
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--confirm') options.confirm = true;
  }

  return { command, options };
}

async function loadRawData(filename: string): Promise<RawLotteryResult[]> {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(content) as RawLotteryResult[];
}

async function migrate(
  filename: string,
  options: { batchSize?: number; dryRun?: boolean } = {},
): Promise<void> {
  const { batchSize = 500, dryRun = false } = options;

  console.log(`\n📥 Migrating: ${filename}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Dry run: ${dryRun}\n`);

  const rawData = await loadRawData(filename);
  console.log(`✅ Loaded ${rawData.length} records`);

  if (!dryRun) {
    await dataSource.initialize();
  }

  // Get existing dates
  const existingDates = new Set<string>();
  if (!dryRun) {
    const existing = await dataSource.manager.find(LotteryResult, {
      select: ['date'],
    });
    existing.forEach((r) =>
      existingDates.add(r.date.toISOString().split('T')[0]),
    );
    console.log(`🔍 Found ${existingDates.size} existing records\n`);
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const migratedDates: string[] = [];

  // Process in batches
  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, i + batchSize);
    const progress = `${Math.min(i + batchSize, rawData.length)}/${rawData.length}`;

    if (dryRun) {
      for (const raw of batch) {
        const dateStr = new Date(raw.date).toISOString().split('T')[0];
        if (existingDates.has(dateStr)) skipped++;
        else inserted++;
      }
    } else {
      await dataSource.transaction(async (manager) => {
        for (const raw of batch) {
          const date = new Date(raw.date);
          const dateStr = date.toISOString().split('T')[0];

          if (existingDates.has(dateStr)) {
            skipped++;
            continue;
          }

          try {
            const result = new LotteryResult();
            result.date = date;
            result.source = filename.replace('.json', '');
            result.region = filename === 'xsmb.json' ? 'XSMB' : 'XSMB_2D';
            result.numbers = [];

            for (const mapping of prizeMappings) {
              const value = raw[mapping.field];
              if (value !== undefined && value !== null) {
                const number = new LotteryNumber();
                number.prizeLevel = mapping.level;
                number.value = String(value).padStart(5, '0');
                number.position = mapping.position;
                number.lotteryResult = result;
                result.numbers.push(number);
              }
            }

            await manager.save(result);
            inserted++;
            existingDates.add(dateStr);
            migratedDates.push(dateStr);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error ${dateStr}: ${message}`);
            errors++;
          }
        }
      });
    }

    console.log(
      `   [${progress}] Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`,
    );
  }

  console.log('\n========================================');
  console.log('📊 Summary:');
  console.log(`   Total: ${rawData.length}`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  // Display successfully migrated dates
  if (migratedDates.length > 0) {
    console.log('\n✅ Migrated Dates:');
    // Print dates in sorted order, 10 per line for readability
    const sortedDates = [...migratedDates].sort();
    for (let i = 0; i < sortedDates.length; i += 10) {
      console.log(`   ${sortedDates.slice(i, i + 10).join(', ')}`);
    }
  }

  console.log('========================================\n');

  if (!dryRun) {
    await dataSource.destroy();
  }
}

async function showStats(): Promise<void> {
  await dataSource.initialize();

  const results = await dataSource.manager.find(LotteryResult);
  const numbers = await dataSource.manager.find(LotteryNumber);

  const byRegion: Record<string, number> = {};
  for (const r of results) {
    byRegion[r.region] = (byRegion[r.region] || 0) + 1;
  }

  const dates = results.map((r) => new Date(r.date).getTime());
  const minDate = dates.length ? new Date(Math.min(...dates)) : null;
  const maxDate = dates.length ? new Date(Math.max(...dates)) : null;

  console.log('\n📊 Database Statistics:');
  console.log(`   Total Results: ${results.length}`);
  console.log(`   Total Numbers: ${numbers.length}`);
  console.log(
    `   Date Range: ${minDate?.toISOString().split('T')[0]} → ${maxDate?.toISOString().split('T')[0]}`,
  );
  console.log('   By Region:');
  for (const [region, count] of Object.entries(byRegion)) {
    console.log(`      ${region}: ${count} results`);
  }
  console.log('');

  await dataSource.destroy();
}

async function clearData(confirm: boolean): Promise<void> {
  if (!confirm) {
    console.log('\n⚠️  WARNING: This will delete ALL lottery data!');
    console.log('   Run with --confirm to proceed.\n');
    return;
  }

  await dataSource.initialize();

  console.log('\n🗑️  Clearing all lottery data...');

  // Get count before deleting
  const numberCount = await dataSource.manager.count(LotteryNumber);
  const resultCount = await dataSource.manager.count(LotteryResult);

  await dataSource.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(LotteryNumber).execute();
    await manager.createQueryBuilder().delete().from(LotteryResult).execute();
  });

  console.log(`✅ Cleared ${numberCount} lottery_numbers`);
  console.log(`✅ Cleared ${resultCount} lottery_results`);
  console.log('✅ Done\n');

  await dataSource.destroy();
}

async function main() {
  const { command, options } = parseArgs();

  switch (command) {
    case 'migrate':
      await migrate((options.file as string) ?? 'xsmb.json', options);
      break;
    case 'stats':
      await showStats();
      break;
    case 'clear':
      await clearData(Boolean(options.confirm));
      break;
    default:
      console.log('\n📖 Usage:');
      console.log(
        '   npx ts-node scripts/migrate-lottery.ts migrate [--2d] [--batch N] [--dry-run]',
      );
      console.log('   npx ts-node scripts/migrate-lottery.ts stats');
      console.log(
        '   npx ts-node scripts/migrate-lottery.ts clear --confirm\n',
      );
  }
}

main().catch(console.error);
