import * as fs from 'fs';
import * as path from 'path';
import { LotteryResult } from '../identity/types/LotteryResult';

export class DataDownloader {
  private readonly XSMB_URL =
    'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/main/data/xsmb.json';
  private readonly XSMB_2_DIGITS_URL =
    'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/main/data/xsmb-2-digits.json';

  private readonly FILE_PATH = path.join(process.cwd(), 'src', 'data', 'raw');
  private readonly XSMB = 'xsmb.json';
  private readonly XSMB_2_DIGITS = 'xsmb-2-digits.json';

  private readonly XSMB_DIR = path.join(this.FILE_PATH, this.XSMB);
  private readonly XSMB_2_DIGITS_DIR = path.join(
    this.FILE_PATH,
    this.XSMB_2_DIGITS,
  );

  getXsmbFilePath(): string {
    return this.XSMB_DIR;
  }

  getXsmb2DigitsFilePath(): string {
    return this.XSMB_2_DIGITS_DIR;
  }

  fileExists(): boolean {
    return (
      fs.existsSync(this.XSMB_DIR) && fs.existsSync(this.XSMB_2_DIGITS_DIR)
    );
  }

  async download(): Promise<void> {
    console.log('Downloading JSON...');

    const res_xsmb = await fetch(this.XSMB_URL);
    const res_xsmb_2_digits = await fetch(this.XSMB_2_DIGITS_URL);

    if (!res_xsmb.ok) {
      throw new Error(`Download failed: ${res_xsmb.status}`);
    }
    if (!res_xsmb_2_digits.ok) {
      throw new Error(`Download failed: ${res_xsmb_2_digits.status}`);
    }

    const data_xsmb = (await res_xsmb.json()) as LotteryResult[];
    const data_xsmb_2_digits =
      (await res_xsmb_2_digits.json()) as LotteryResult[];

    const dir = path.dirname(this.XSMB_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // ghi đè trực tiếp
    fs.writeFileSync(
      this.XSMB_DIR,
      JSON.stringify(data_xsmb, null, 2),
      'utf-8',
    );
    fs.writeFileSync(
      this.XSMB_2_DIGITS_DIR,
      JSON.stringify(data_xsmb_2_digits, null, 2),
      'utf-8',
    );

    console.log('✅ JSON saved');
  }

  async ensureFile(): Promise<void> {
    if (!this.fileExists()) {
      console.log('⚠️ JSON not found → downloading...');
      await this.download();
    }
  }
}
