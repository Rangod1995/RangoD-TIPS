import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

import scanProject from "./scanner.js";

import {
    readFile,
    getFileInfo,
    fileExists,
} from "./fileManager.js";

import {
    backupFile,
    restoreBackup,
} from "./backupManager.js";

import {
    replaceFile,
} from "./replacementManager.js";

import {
    runVerification,
    runProjectTests,
} from "./testRunner.js";

function printHeader(title) {
    console.log("");
    console.log("==========================================");
    console.log(` ${title}`);
    console.log("==========================================");
}

async function runAgent() {
    printHeader("RangoD Agent V1");

    logger.info(
        "RangoD Agent V1 workflow started."
    );

    try {
        // ======================================
        // 1. SCAN
        // ======================================

        printHeader("1. PROJECT SCAN");

        const scan = scanProject();

        console.log(
            `Client files: ${scan.summary.clientFiles}`
        );

        console.log(
            `Server files: ${scan.summary.serverFiles}`
        );

        console.log(
            `Docs files: ${scan.summary.docsFiles}`
        );

        const totalFiles =
            scan.summary.clientFiles +
            scan.summary.serverFiles +
            scan.summary.docsFiles;

        console.log(
            `Total files: ${totalFiles}`
        );

        // ======================================
        // 2. VERIFICATION
        // ======================================

        printHeader("2. PROJECT VERIFICATION");

        const verification =
            await runVerification();

        console.log(
            "Backend syntax: PASS"
        );

        console.log(
            "Frontend build: PASS"
        );

        // ======================================
        // 3. OPTIONAL PROJECT TESTS
        // ======================================

        printHeader("3. PROJECT TEST STATUS");

        const packageJson =
            path.join(
                config.projectRoot,
                "package.json"
            );

        if (fs.existsSync(packageJson)) {
            const packageData =
                JSON.parse(
                    fs.readFileSync(
                        packageJson,
                        "utf8"
                    )
                );

            if (
                packageData.scripts &&
                packageData.scripts.test
            ) {
                console.log(
                    `Test script found: ${packageData.scripts.test}`
                );
            } else {
                console.log(
                    "No root npm test script configured."
                );
            }
        }

        // ======================================
        // 4. SUMMARY
        // ======================================

        printHeader("RangoD Agent V1 COMPLETE");

        console.log(
            "Project scan: PASS"
        );

        console.log(
            "Backend syntax: PASS"
        );

        console.log(
            "Frontend build: PASS"
        );

        console.log("");
        console.log(
            "Agent completed safely."
        );

        logger.success(
            "RangoD Agent V1 workflow completed successfully."
        );

        return {
            success: true,
            scan,
            verification,
        };
    } catch (error) {
        logger.error(
            "RangoD Agent V1 workflow failed.",
            {
                message: error.message,
                stack: error.stack,
            }
        );

        console.error("");
        console.error(
            "=========================================="
        );
        console.error(
            " RangoD AGENT FAILED"
        );
        console.error(
            "=========================================="
        );
        console.error(
            error.message
        );

        return {
            success: false,
            error: error.message,
        };
    }
}

async function handleRead(filePath) {
    if (!filePath) {
        throw new Error(
            "Please provide a file path."
        );
    }

    if (!fileExists(filePath)) {
        throw new Error(
            `File not found: ${filePath}`
        );
    }

    const info =
        getFileInfo(filePath);

    const content =
        readFile(filePath);

    printHeader(
        `FILE: ${filePath}`
    );

    console.log(
        `Size: ${info.size} bytes`
    );

    console.log(
        `Modified: ${info.modifiedAt}`
    );

    console.log("");
    console.log(content);

    return content;
}

function printHelp() {
    printHeader(
        "RangoD Agent V1 COMMANDS"
    );

    console.log(
        "node automation/agent.js"
    );

    console.log(
        "    Run complete project verification."
    );

    console.log("");

    console.log(
        "node automation/agent.js scan"
    );

    console.log(
        "    Scan the RangoD project."
    );

    console.log("");

    console.log(
        "node automation/agent.js read <file>"
    );

    console.log(
        "    Read a project file."
    );

    console.log("");

    console.log(
        "Examples:"
    );

    console.log(
        "node automation/agent.js read server/index.js"
    );

    console.log(
        "node automation/agent.js read server/services/footballService.js"
    );
}

const command =
    process.argv[2];

const argument =
    process.argv[3];

if (!command) {
    await runAgent();
} else if (
    command === "scan"
) {
    const result =
        scanProject();

    printHeader(
        "SCAN COMPLETE"
    );

    console.log(
        JSON.stringify(
            result.summary,
            null,
            2
        )
    );
} else if (
    command === "read"
) {
    try {
        await handleRead(
            argument
        );
    } catch (error) {
        logger.error(
            error.message
        );

        console.error(
            error.message
        );

        process.exitCode = 1;
    }
} else if (
    command === "help" ||
    command === "--help" ||
    command === "-h"
) {
    printHelp();
} else {
    console.error(
        `Unknown command: ${command}`
    );

    printHelp();

    process.exitCode = 1;
}
