import fs from "fs";
import path from "path";

const ROOT = path.resolve(".");
const PLANS_DIR = path.join(ROOT, "repairs", "plans");
const PENDING_DIR = path.join(ROOT, "repairs", "pending");

fs.mkdirSync(PENDING_DIR, { recursive: true });

function getLatestPlan() {
    if (!fs.existsSync(PLANS_DIR)) {
        throw new Error("Plans directory does not exist.");
    }

    const files = fs.readdirSync(PLANS_DIR)
        .filter(file => file.endsWith(".json"))
        .map(file => ({
            file,
            fullPath: path.join(PLANS_DIR, file),
            time: fs.statSync(path.join(PLANS_DIR, file)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

    if (!files.length) {
        throw new Error("No repair plan found.");
    }

    return JSON.parse(
        fs.readFileSync(files[0].fullPath, "utf8")
    );
}

function createRepairRequest(plan) {
    if (!plan.problem) {
        throw new Error("Repair plan has no problem description.");
    }

    if (!plan.candidates || !plan.candidates.length) {
        throw new Error("Repair plan contains no candidate files.");
    }

    const target = plan.candidates[0].file;

    const repairId =
        `REPAIR-${Date.now()}`;

    const repair = {
        repairId,
        createdAt: new Date().toISOString(),

        problem: plan.problem,

        target,

        reason:
            `Automatically selected highest-scoring candidate from ${plan.planId}.`,

        status: "PENDING",

        instructions: [
            "Inspect the target file.",
            "Determine the root cause of the reported problem.",
            "Make the smallest safe correction.",
            "Return the complete corrected file.",
            "Do not modify unrelated functionality.",
            "Preserve existing functionality."
        ],

        verification: [
            "node --check server/index.js",
            "npm run build"
        ]
    };

    const repairPath =
        path.join(
            PENDING_DIR,
            `${repairId}.json`
        );

    fs.writeFileSync(
        repairPath,
        JSON.stringify(
            repair,
            null,
            2
        ),
        "utf8"
    );

    return {
        repair,
        repairPath
    };
}

try {

    console.log("");
    console.log("==========================================");
    console.log(" RangoD AUTOMATIC REPAIR REQUEST");
    console.log("==========================================");

    const plan =
        getLatestPlan();

    console.log(
        `Problem: ${plan.problem}`
    );

    console.log(
        `Plan: ${plan.planId}`
    );

    console.log(
        `Selected target: ${plan.candidates[0].file}`
    );

    const result =
        createRepairRequest(plan);

    console.log("");
    console.log(
        "Repair request created successfully."
    );

    console.log(
        `Repair ID: ${result.repair.repairId}`
    );

    console.log(
        `Target: ${result.repair.target}`
    );

    console.log(
        `Saved: ${result.repairPath}`
    );

    console.log("");
    console.log(
        "=========================================="
    );

} catch (error) {

    console.error("");
    console.error(
        "❌ REPAIR REQUEST FAILED"
    );

    console.error(
        error.message
    );

    process.exit(1);
}
