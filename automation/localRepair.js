import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

function normalize(value) {
    return String(value || "").toLowerCase();
}

function analyzeLiveMatches(filePath, content) {
    const text = normalize(content);

    const findings = [];

    if (
        text.includes("live") &&
        (
            text.includes("matches") ||
            text.includes("fixtures")
        )
    ) {
        findings.push(
            "File contains live-match related logic."
        );
    }

    if (
        text.includes("length === 0") ||
        text.includes("length === 0")
    ) {
        findings.push(
            "File contains an empty-result check."
        );
    }

    if (
        text.includes("setmatches") ||
        text.includes("setmatches(")
    ) {
        findings.push(
            "File manages match state."
        );
    }

    if (
        text.includes("fetch(") ||
        text.includes("axios")
    ) {
        findings.push(
            "File performs or references API communication."
        );
    }

    if (
        text.includes("dashboard") ||
        filePath.toLowerCase().includes("dashboard")
    ) {
        findings.push(
            "File is part of the dashboard/live-match presentation layer."
        );
    }

    return findings;
}

function inspectFile(filePath, content) {
    const findings =
        analyzeLiveMatches(
            filePath,
            content
        );

    return {
        filePath,
        findings,
        likelyIssue:
            findings.length > 0
                ? "Live-match handling exists in this file and requires inspection."
                : "No strong local live-match indicators found."
    };
}

async function runLocalRepair(
    task,
    filePath,
    currentContent
) {
    if (!task || !filePath) {
        throw new Error(
            "Local repair requires a task and target file."
        );
    }

    logger.info(
        "Running local repair analysis.",
        {
            filePath
        }
    );

    const inspection =
        inspectFile(
            filePath,
            currentContent
        );

    /*
     * Safety rule:
     *
     * The local engine NEVER invents a complete
     * replacement file.
     *
     * It only performs deterministic repairs
     * that have an explicitly implemented rule.
     */

    const taskText =
        normalize(task);

    /*
     * Current supported repair:
     *
     * If the task concerns live matches but
     * the file is not a clear API/data source,
     * do not modify it automatically.
     *
     * This prevents the planner from blindly
     * changing a React component when the real
     * problem may be in the backend.
     */

    if (
        taskText.includes("live matches") &&
        !(
            taskText.includes("empty state") ||
            taskText.includes("display") ||
            taskText.includes("render")
        )
    ) {
        return {
            success: true,
            modified: false,
            reason:
                "Local engine safely refused automatic modification because the live-match task may require investigation across the frontend and backend data pipeline.",
            inspection
        };
    }

    return {
        success: true,
        modified: false,
        reason:
            "No deterministic local repair rule matched this task. No file was changed.",
        inspection
    };
}

export {
    runLocalRepair,
    inspectFile
};

export default {
    runLocalRepair,
    inspectFile
};
