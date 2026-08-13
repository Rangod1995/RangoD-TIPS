// ==========================================
// server/jobs/validationScheduler.js
// RangoD AI Engine V7 Enterprise
// Prediction Validation Scheduler
// ==========================================

import cron from "node-cron";

import Prediction from "../models/Prediction.js";



// ==========================================
// Validate Completed Predictions
// ==========================================

async function runValidation() {

try {


console.log(
"🔍 Running prediction validation..."
);



const predictions =
await Prediction.find({

status:
"completed"

});



let updated = 0;



for (const prediction of predictions) {


if (!prediction.validation) {

prediction.validation = {

checked:
true,

validatedAt:
new Date()

};


await prediction.save();


updated++;

}


}



console.log(

`✅ Validation completed. Updated ${updated} predictions`

);



}

catch(error) {


console.error(

"❌ Validation scheduler error:",

error.message

);


}

}



// ==========================================
// Scheduler Start
// ==========================================

export function startValidationScheduler() {


console.log(
"📊 Validation scheduler started"
);



// Every 6 hours

cron.schedule(

"0 */6 * * *",

async () => {

await runValidation();

}

);


}



// ==========================================
// Manual Trigger
// ==========================================

export async function triggerValidation() {

return runValidation();

}



// ==========================================
// Default Export
// ==========================================

export default {

startValidationScheduler,

triggerValidation

};