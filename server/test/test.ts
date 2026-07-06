import { DataService } from "../src/jobs/data.processor";

async function run() {
  const service = new DataService();

  const data = await service.getXsmbData();

  await service.dailyUpdate();
  console.log("DATA LENGTH:", data.length);
  console.log(
    "SAMPLE:",
    data.slice(0, 5).map((d) => ({
      date: d.date,
      special: d.special,
      prize1: d.prize1,
      prize2_1: d.prize2_1,
      prize2_2: d.prize2_2,
      prize3_1: d.prize3_1,
    })),
  );
}

run();
