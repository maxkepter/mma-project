import * as fs from "fs";
import { DataDownloader } from "./data.download";
import { LotteryResult } from "../identity/types/LotteryResult";

// @Injectable()
export class DataService {
  private downloader = new DataDownloader();

  async getXsmbData(): Promise<LotteryResult[]> {
    await this.downloader.ensureFile();

    const filePath = this.downloader.getXsmbFilePath();

    const raw = fs.readFileSync(filePath, "utf-8");

    return JSON.parse(raw) as LotteryResult[];
  }
  async getXsmb2DigitsData(): Promise<LotteryResult[]> {
    await this.downloader.ensureFile();

    const filePath = this.downloader.getXsmb2DigitsFilePath();

    const raw = fs.readFileSync(filePath, "utf-8");

    return JSON.parse(raw) as LotteryResult[];
  }

  // Cron: update mỗi ngày
  // @Cron('0 1 * * *')
  async dailyUpdate(): Promise<void> {
    console.log("⏰ Updating JSON daily...");
    await this.downloader.download();
    console.log("✅ Done");
  }
}
