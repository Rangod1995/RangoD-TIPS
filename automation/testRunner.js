import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

import {
    runCommand,
} from "./commandRunner.js";

async function runSyntaxCheck() {
    logger.info(
        "Running backend syntax check..."
    );

    return runCommand(
        process.platform === "win32"
            ? "node.exe"
            : "node",
        [
            "--check",
            path.join(
                config.serverRoot,
                "index.js"
            ),
        ],
        {
            cwd: config.projectRoot,
            timeout: 60000,
        }
    );
}

async function runFrontendBuild() {
    logger.info(
        "Running frontend production build..."
    );

    if (process.platform === "win32") {
        return runCommand(
            process.env.ComSpec,
            [
                "/d",
                "/s",
                "/c",
                "npm.cmd run build",
            ],
            {
                cwd: config.clientRoot,
                timeout: 180000,
            }
        );
    }

    return runCommand(
        "npm",
        [
            "run",
            "build",
        ],
        {
            cwd: config.clientRoot,
            timeout: 180000,
        }
    );
}

async function runProjectTests() {
    logger.info(
        "Running project tests..."
    );

    if (process.platform === "win32") {
        return runCommand(
            process.env.ComSpec,
            [
                "/d",
                "/s",
                "/c",
                "npm.cmd test",
            ],
            {
                cwd: config.projectRoot,
                timeout: 180000,
                allowFailure: true,
            }
        );
    }

    return runCommand(
        "npm",
        [
            "test",
        ],
        {
            cwd: config.projectRoot,
            timeout: 180000,
            allowFailure: true,
        }
    );
}

async function runVerification() {
    const results = {};

    results.syntax =
        await runSyntaxCheck();

    results.build =
        await runFrontendBuild();

    return results;
}

export {
    runCommand,
    runSyntaxCheck,
    runFrontendBuild,
    runProjectTests,
    runVerification,
};

export default {
    runCommand,
    runSyntaxCheck,
    runFrontendBuild,
    runProjectTests,
    runVerification,
};
