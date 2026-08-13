import fs from "fs";
import path from "path";

import config from "./config.js";
import {
    replaceFile,
} from "./replacementManager.js";

const testDirectory = path.join(
    config.serverRoot,
    ".agent-test"
);

const testFile = path.join(
    testDirectory,
    "replacement-test.txt"
);

const relativeTestFile =
    "server/.agent-test/replacement-test.txt";

const originalContent =
    "RangoD Agent ORIGINAL TEST CONTENT";

const replacementContent =
    "RangoD Agent REPLACEMENT TEST CONTENT";

console.log("");
console.log("==========================================");
console.log(" RangoD Safe Replacement Test");
console.log("==========================================");

try {
    fs.mkdirSync(
        testDirectory,
        {
            recursive: true,
        }
    );

    fs.writeFileSync(
        testFile,
        originalContent,
        "utf8"
    );

    console.log("");
    console.log("[1] Temporary test file created.");

    console.log("");
    console.log("[2] Creating backup and replacing...");

    const result = replaceFile(
        relativeTestFile,
        replacementContent
    );

    console.log(result);

    const replacedContent =
        fs.readFileSync(
            testFile,
            "utf8"
        );

    if (
        replacedContent !==
        replacementContent
    ) {
        throw new Error(
            "Replacement verification failed."
        );
    }

    console.log("");
    console.log(
        "[3] Replacement verified successfully."
    );

    console.log("");
    console.log(
        "[4] Removing temporary test directory..."
    );

    fs.rmSync(
        testDirectory,
        {
            recursive: true,
            force: true,
        }
    );

    console.log("");
    console.log(
        "[5] Temporary test files removed."
    );

    console.log("");
    console.log("==========================================");
    console.log(" SAFE REPLACEMENT TEST PASSED");
    console.log("==========================================");
} catch (error) {
    console.error("");
    console.error("==========================================");
    console.error(" SAFE REPLACEMENT TEST FAILED");
    console.error("==========================================");
    console.error(error.message);

    try {
        fs.rmSync(
            testDirectory,
            {
                recursive: true,
                force: true,
            }
        );
    } catch {}

    process.exitCode = 1;
}
