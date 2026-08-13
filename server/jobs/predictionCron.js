import cron from "node-cron";
import {
  generateDailyPredictions,
  getTodayPredictions,
} from "../services/predictionService.js";

async function ensureTodayPredictions() {
  try {
    console.log("🔍 Checking today's predictions...");

    const existing = await getTodayPredictions();

    if (existing.length > 0) {
      console.log(
        `⚠️ ${existing.length} prediction(s) already exist for today. Regenerating anyway...`
      );
    } else {
      console.log("⚡ No predictions found for today.");
    }

    console.log("🤖 Generating today's AI predictions...");

    const predictions = await generateDailyPredictions();

    console.log(
      `✅ Successfully generated ${predictions.length} prediction(s).`
    );

  } catch (error) {
    console.error("❌ Failed to ensure today's predictions:");
    console.error(error);
  }
}


// Runs every day at 12:05 AM Lagos time
const predictionCron = cron.schedule(
  "5 0 * * *",
  async () => {
    console.log("⏰ Daily prediction scheduler triggered.");

    await ensureTodayPredictions();
  },
  {
    scheduled: false,
    timezone: "Africa/Lagos",
  }
);


// Allow index.js to trigger startup generation AFTER MongoDB connects
predictionCron.ensureTodayPredictions = ensureTodayPredictions;


export default predictionCron;