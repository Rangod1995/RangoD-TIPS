import cron from "node-cron";
import { validatePredictions } from "../services/validationService.js";

const validationCron = cron.schedule(
  "30 0 * * *",
  async () => {
    console.log("🔍 Running prediction validation...");

    try {
      const validated = await validatePredictions();

      console.log(
        `✅ Validation complete. ${validated} prediction(s) updated.`
      );
    } catch (error) {
      console.error("❌ Validation failed:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Lagos",
  }
);

export default validationCron;