// ==========================================
// server/jobs/predictionScheduler.js
// RangoD AI Engine V7 Enterprise
// Daily Prediction Scheduler
// ==========================================

import cron from "node-cron";

import {
  generateDailyPredictions
} from "../services/predictionService.js";



// ==========================================
// Generate Predictions Job
// ==========================================

async function runPredictionGeneration() {

try {


console.log(
"🤖 Starting daily AI prediction generation..."
);



const predictions =
await generateDailyPredictions();



console.log(

`✅ Generated ${predictions.length} predictions`

);



}

catch(error) {


console.error(

"❌ Prediction generation failed:",

error.message

);


}

}



// ==========================================
// Scheduler
// ==========================================

export function startPredictionScheduler() {


console.log(
"📅 Prediction scheduler started"
);


// Every day at 00:05

cron.schedule(
"5 0 * * *",

async () => {

await runPredictionGeneration();

}

);


}



// ==========================================
// Manual Trigger
// ==========================================

export async function triggerPredictionGeneration() {

return runPredictionGeneration();

}



// ==========================================
// Default Export
// ==========================================

export default {

startPredictionScheduler,

triggerPredictionGeneration

};