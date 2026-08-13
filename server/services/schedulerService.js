import cron from "node-cron";
import axios from "axios";

import { config } from "../config/env.js";
import { generateDailyPredictions } from "./predictionService.js";
import { evaluateFinishedFixtures } from "./learningService.js";

export async function processFinishedMatches() {
    try {
        const today = new Date().toISOString().split("T")[0];

        const { data } = await axios.get(
            `${config.footballApiUrl}/fixtures`,
            {
                headers: {
                    "x-apisports-key": config.footballApiKey,
                },
                params: {
                    date: today,
                    status: "FT",
                },
            }
        );

        const fixtures = data.response ?? [];

        if (!fixtures.length) {
            console.log("Learning Engine: No finished fixtures found.");
            return [];
        }

        const results = await evaluateFinishedFixtures(fixtures);

        console.log(
            `Learning Engine: ${results.length} prediction(s) evaluated.`
        );

        return results;
    } catch (error) {
        console.error(
            "Learning Engine Error:",
            error.response?.data || error.message
        );

        return [];
    }
}

export function startScheduler() {
    console.log("Starting RangoD TIPS Scheduler...");

    // Evaluate finished matches every day at 23:15
    cron.schedule("15 23 * * *", async () => {
        console.log("Evaluating finished matches...");

        try {
            await processFinishedMatches();
            console.log("Finished match evaluation completed.");
        } catch (error) {
            console.error(
                "Learning Scheduler Error:",
                error.message
            );
        }
    });

    console.log("Scheduler started successfully.");
}

export default {
    startScheduler,
    processFinishedMatches,
};
