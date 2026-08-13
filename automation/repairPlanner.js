import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

const SUPPORTED_EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".css",
    ".html",
    ".md",
]);

const KEYWORD_MAP = {
    prediction: [
        "prediction",
        "predictions",
        "predictionservice",
        "predictionengine",
        "scoreline",
        "confidence",
        "market",
    ],

    football: [
        "football",
        "fixture",
        "fixtures",
        "live match",
        "live matches",
        "footballservice",
        "matchcontroller",
    ],

    authentication: [
        "login",
        "logout",
        "register",
        "authentication",
        "auth",
        "jwt",
        "protected",
        "password",
    ],

    dashboard: [
        "dashboard",
        "profile",
        "favorites",
        "stats",
        "recent predictions",
    ],

    payment: [
        "payment",
        "paystack",
        "subscription",
        "checkout",
        "premium",
    ],

    frontend: [
        "react",
        "component",
        "page",
        "frontend",
        "vite",
        "jsx",
        "ui",
    ],

    backend: [
        "backend",
        "express",
        "server",
        "api",
        "route",
        "controller",
        "middleware",
    ],
};

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function collectFiles(directory) {
    const files = [];

    if (!fs.existsSync(directory)) {
        return files;
    }

    const entries = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name === "dist" ||
            entry.name === "build"
        ) {
            continue;
        }

        const fullPath = path.join(
            directory,
            entry.name
        );

        if (entry.isDirectory()) {
            files.push(
                ...collectFiles(fullPath)
            );

            continue;
        }

        const extension = path.extname(
            entry.name
        ).toLowerCase();

        if (
            SUPPORTED_EXTENSIONS.has(
                extension
            )
        ) {
            files.push(fullPath);
        }
    }

    return files;
}

function scoreFile(
    filePath,
    content,
    task
) {
    const normalizedTask =
        normalizeText(task);

    const normalizedPath =
        normalizeText(
            path.relative(
                config.projectRoot,
                filePath
            )
        );

    const normalizedContent =
        normalizeText(content);

    let score = 0;

    const matches = [];

    for (
        const [category, keywords]
        of Object.entries(KEYWORD_MAP)
    ) {
        for (
            const keyword
            of keywords
        ) {
            if (
                normalizedTask.includes(
                    keyword
                )
            ) {
                if (
                    normalizedPath.includes(
                        keyword
                    )
                ) {
                    score += 20;

                    matches.push(
                        `${category}:path:${keyword}`
                    );
                }

                if (
                    normalizedContent.includes(
                        keyword
                    )
                ) {
                    score += 3;

                    matches.push(
                        `${category}:content:${keyword}`
                    );
                }
            }
        }
    }

    const fileName =
        normalizeText(
            path.basename(filePath)
        );

    const taskWords =
        normalizedTask
            .split(/[^a-z0-9]+/)
            .filter(
                word =>
                    word.length >= 4
            );

    for (
        const word
        of taskWords
    ) {
        if (
            fileName.includes(word)
        ) {
            score += 15;

            matches.push(
                `filename:${word}`
            );
        }

        if (
            normalizedPath.includes(word)
        ) {
            score += 8;

            matches.push(
                `path:${word}`
            );
        }
    }

    return {
        score,
        matches: [
            ...new Set(matches),
        ],
    };
}

export function planRepair(task) {
    if (
        !task ||
        !String(task).trim()
    ) {
        throw new Error(
            "Repair task cannot be empty."
        );
    }

    logger.info(
        "Creating repair plan.",
        {
            task,
        }
    );

    const files = [
        ...collectFiles(
            config.serverRoot
        ),

        ...collectFiles(
            config.clientRoot
        ),
    ];

    const candidates = [];

    for (
        const filePath
        of files
    ) {
        let content = "";

        try {
            const stats =
                fs.statSync(
                    filePath
                );

            if (
                stats.size >
                config.maxFileSize
            ) {
                continue;
            }

            content =
                fs.readFileSync(
                    filePath,
                    "utf8"
                );
        } catch {
            continue;
        }

        const result =
            scoreFile(
                filePath,
                content,
                task
            );

        if (
            result.score > 0
        ) {
            candidates.push({
                file: path.relative(
                    config.projectRoot,
                    filePath
                ),

                absolutePath:
                    filePath,

                score:
                    result.score,

                matches:
                    result.matches,
            });
        }
    }

    candidates.sort(
        (a, b) =>
            b.score - a.score
    );

    const topCandidates =
        candidates.slice(
            0,
            10
        );

    const plan = {
        task:
            String(task).trim(),

        createdAt:
            new Date().toISOString(),

        candidates:
            topCandidates,

        recommendedFile:
            topCandidates.length > 0
                ? topCandidates[0].file
                : null,

        confidence:
            topCandidates.length === 0
                ? 0
                : Math.min(
                    100,
                    topCandidates[0].score
                ),
    };

    logger.success(
        "Repair plan created.",
        {
            recommendedFile:
                plan.recommendedFile,

            confidence:
                plan.confidence,

            candidates:
                topCandidates.length,
        }
    );

    return plan;
}

export function printRepairPlan(
    plan
) {
    console.log("");

    console.log(
        "=========================================="
    );

    console.log(
        " RangoD REPAIR PLAN"
    );

    console.log(
        "=========================================="
    );

    console.log("");

    console.log(
        `Task: ${plan.task}`
    );

    console.log(
        `Recommended file: ${
            plan.recommendedFile ||
            "NONE"
        }`
    );

    console.log(
        `Confidence: ${
            plan.confidence
        }%`
    );

    console.log("");

    if (
        plan.candidates.length === 0
    ) {
        console.log(
            "No matching files found."
        );

        console.log("");

        console.log(
            "=========================================="
        );

        return;
    }

    console.log(
        "Candidate files:"
    );

    plan.candidates.forEach(
        (candidate, index) => {
            console.log("");

            console.log(
                `${index + 1}. ${
                    candidate.file
                }`
            );

            console.log(
                `   Score: ${
                    candidate.score
                }`
            );

            console.log(
                `   Matches: ${
                    candidate.matches.join(
                        ", "
                    )
                }`
            );
        }
    );

    console.log("");

    console.log(
        "=========================================="
    );
}

function saveRepairPlan(plan) {
    const plansDirectory =
        path.join(
            config.projectRoot,
            "repairs",
            "plans"
        );

    fs.mkdirSync(
        plansDirectory,
        {
            recursive: true,
        }
    );

    const timestamp =
        Date.now();

    const planFile =
        path.join(
            plansDirectory,
            `PLAN-${timestamp}.json`
        );

    fs.writeFileSync(
        planFile,
        JSON.stringify(
            plan,
            null,
            4
        ),
        "utf8"
    );

    return planFile;
}

function main() {
    const task =
        process.argv
            .slice(2)
            .join(" ")
            .trim();

    if (!task) {
        console.error(
            "Usage:"
        );

        console.error(
            'node automation\\repairPlanner.js "repair task"'
        );

        process.exit(1);
    }

    try {
        const plan =
            planRepair(task);

        printRepairPlan(plan);

        const planFile =
            saveRepairPlan(plan);

        console.log("");

        console.log(
            `Plan saved: ${planFile}`
        );

        console.log("");

        console.log(
            "RangoD repair planning completed successfully."
        );
    } catch (error) {
        logger.error(
            "Repair planner failed.",
            {
                error:
                    error?.stack ||
                    error?.message ||
                    String(error),
            }
        );

        console.error(
            error?.stack ||
            error?.message ||
            String(error)
        );

        process.exit(1);
    }
}

main();

export default {
    planRepair,
    printRepairPlan,
};

