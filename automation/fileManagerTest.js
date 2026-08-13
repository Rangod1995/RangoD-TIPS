import {
    fileExists,
    readFile,
    getFileInfo,
} from "./fileManager.js";

import {
    backupFile,
} from "./backupManager.js";

console.log("");
console.log("==========================================");
console.log(" RangoD Agent File Manager Test");
console.log("==========================================");

const testFile = "server/index.js";

try {
    console.log("");
    console.log(`[1] Checking: ${testFile}`);

    const exists = fileExists(testFile);

    console.log(
        `Exists: ${exists ? "YES" : "NO"}`
    );

    if (!exists) {
        throw new Error(
            `${testFile} was not found.`
        );
    }

    console.log("");
    console.log("[2] Reading file...");

    const content = readFile(testFile);

    console.log(
        `Read successfully: ${content.length} characters`
    );

    console.log("");
    console.log("[3] Reading file metadata...");

    const info = getFileInfo(testFile);

    console.log(info);

    console.log("");
    console.log("[4] Creating automatic backup...");

    const backup = backupFile(testFile);

    console.log(
        `Backup created: ${backup.backup}`
    );

    console.log("");
    console.log("==========================================");
    console.log(" FILE MANAGER TEST PASSED");
    console.log("==========================================");
} catch (error) {
    console.error("");
    console.error("==========================================");
    console.error(" FILE MANAGER TEST FAILED");
    console.error("==========================================");
    console.error(error.message);
    process.exitCode = 1;
}
