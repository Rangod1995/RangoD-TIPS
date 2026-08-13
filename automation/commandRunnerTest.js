import fs from "fs";
import path from "path";

import config from "./config.js";

import {
    runCommand,
} from "./commandRunner.js";

import {
    runSyntaxCheck,
    runFrontendBuild,
} from "./testRunner.js";

console.log("");
console.log("==========================================");
console.log(" RangoD Command Runner Test");
console.log("==========================================");

let temporaryDirectory = null;

try {
    console.log("");
    console.log("[1] Testing Node command execution...");

    temporaryDirectory = path.join(
        config.automationRoot,
        ".command-test"
    );

    fs.mkdirSync(
        temporaryDirectory,
        {
            recursive: true,
        }
    );

    const temporaryFile = path.join(
        temporaryDirectory,
        "hello.js"
    );

    fs.writeFileSync(
        temporaryFile,
        "console.log('RangoD command runner works');",
        "utf8"
    );

    const nodeResult =
        await runCommand(
            process.platform === "win32"
                ? "node.exe"
                : "node",
            [
                temporaryFile,
            ],
            {
                cwd: config.projectRoot,
                timeout: 30000,
            }
        );

    if (!nodeResult.success) {
        throw new Error(
            "Node command test failed."
        );
    }

    console.log("");
    console.log("[2] Testing backend syntax check...");

    await runSyntaxCheck();

    console.log("");
    console.log(
        "[3] Testing frontend production build..."
    );

    await runFrontendBuild();

    console.log("");
    console.log("==========================================");
    console.log(" COMMAND + TEST RUNNER PASSED");
    console.log("==========================================");
} catch (error) {
    console.error("");
    console.error("==========================================");
    console.error(" COMMAND + TEST RUNNER FAILED");
    console.error("==========================================");
    console.error(error.message);

    process.exitCode = 1;
} finally {
    if (temporaryDirectory) {
        try {
            fs.rmSync(
                temporaryDirectory,
                {
                    recursive: true,
                    force: true,
                }
            );
        } catch {}
    }
}
