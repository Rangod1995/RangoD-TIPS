import fs from "fs";
import path from "path";

const ROOT = path.resolve(".");
const REPAIR_DIR = path.join(ROOT, "repairs");
const PENDING_DIR = path.join(REPAIR_DIR, "pending");
const PLANS_DIR = path.join(REPAIR_DIR, "plans");

for (const dir of [PENDING_DIR, PLANS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
}

const IGNORE = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "repairs"
]);

const EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".css",
    ".html"
]);

function scanDirectory(directory, results = []) {

    if (!fs.existsSync(directory)) {
        return results;
    }

    for (const entry of fs.readdirSync(directory, {
        withFileTypes: true
    })) {

        if (IGNORE.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            scanDirectory(fullPath, results);
            continue;
        }

        const extension = path.extname(entry.name).toLowerCase();

        if (!EXTENSIONS.has(extension)) {
            continue;
        }

        try {

            const content = fs.readFileSync(
                fullPath,
                "utf8"
            );

            results.push({
                file: path.relative(ROOT, fullPath),
                size: content.length,
                lines: content.split(/\r?\n/).length,
                content
            });

        } catch {}

    }

    return results;
}

function scoreFile(file, problem) {

    const text = (
        file.file +
        "\n" +
        file.content
    ).toLowerCase();

    const words = problem
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(word => word.length >= 3);

    let score = 0;

    for (const word of words) {

        if (text.includes(word)) {
            score++;
        }
    }

    const keywords = [
        "live",
        "match",
        "fixture",
        "prediction",
        "football",
        "api",
        "score",
        "result"
    ];

    for (const keyword of keywords) {

        if (
            problem.toLowerCase().includes(keyword) &&
            text.includes(keyword)
        ) {
            score += 2;
        }
    }

    return score;
}

function createPlan(problem) {

    const files = scanDirectory(ROOT);

    const ranked = files
        .map(file => ({
            file: file.file,
            score: scoreFile(file, problem),
            lines: file.lines,
            size: file.size
        }))
        .filter(file => file.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);

    const planId =
        `PLAN-${Date.now()}`;

    const plan = {
        planId,
        createdAt: new Date().toISOString(),
        problem,
        status: "ANALYSIS_ONLY",
        candidates: ranked,
        nextStep:
            "Review candidates and generate a repair request."
    };

    const planPath = path.join(
        PLANS_DIR,
        `${planId}.json`
    );

    fs.writeFileSync(
        planPath,
        JSON.stringify(plan, null, 2),
        "utf8"
    );

    console.log("");
    console.log("==========================================");
    console.log(" RangoD REPAIR PLANNER");
    console.log("==========================================");
    console.log(`Problem: ${problem}`);
    console.log("");
    console.log("Candidate files:");

    if (!ranked.length) {

        console.log("No matching files found.");

    } else {

        ranked.forEach((file, index) => {

            console.log(
                `${index + 1}. ${file.file} ` +
                `(score: ${file.score})`
            );

        });
    }

    console.log("");
    console.log(`Plan saved: ${planPath}`);
    console.log("==========================================");
}

const problem = process.argv
    .slice(2)
    .join(" ")
    .trim();

if (!problem) {

    console.error(
        "Usage: node agent\\planner.js \"describe the problem\""
    );

    process.exit(1);
}

createPlan(problem);
