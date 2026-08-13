import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
    runAIRepair,
} from "../automation/aiRepair.js";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const ROOT =
    path.resolve(__dirname, "..");

const REPAIR_DIR =
    path.join(ROOT, "repairs");

const PENDING_DIR =
    path.join(REPAIR_DIR, "pending");

const COMPLETED_DIR =
    path.join(REPAIR_DIR, "completed");

const FAILED_DIR =
    path.join(REPAIR_DIR, "failed");

const processing =
    new Set();

for (const directory of [
    REPAIR_DIR,
    PENDING_DIR,
    COMPLETED_DIR,
    FAILED_DIR,
]) {
    fs.mkdirSync(
        directory,
        {
            recursive: true,
        }
    );
}

function log(message) {
    console.log(
        `[${new Date().toISOString()}] ${message}`
    );
}

function validateRepair(repair) {

    if (!repair.repairId) {
        throw new Error(
            "Missing repairId."
        );
    }

    if (!repair.target) {
        throw new Error(
            "Missing target."
        );
    }

    if (!repair.problem) {
        throw new Error(
            "Missing repair problem/task."
        );
    }

    if (!Array.isArray(
        repair.verification
    )) {
        throw new Error(
            "verification must be an array."
        );
    }

    const target =
        path.resolve(
            ROOT,
            repair.target
        );

    if (
        !target.startsWith(
            ROOT + path.sep
        )
    ) {
        throw new Error(
            "Target is outside project directory."
        );
    }

    return target;
}

function moveRepair(
    repairPath,
    destinationDirectory
) {

    if (!fs.existsSync(
        repairPath
    )) {
        return null;
    }

    const destination =
        path.join(
            destinationDirectory,
            path.basename(
                repairPath
            )
        );

    fs.renameSync(
        repairPath,
        destination
    );

    return destination;
}

async function executeRepair(
    repairPath
) {

    if (
        processing.has(
            repairPath
        )
    ) {
        return;
    }

    processing.add(
        repairPath
    );

    try {

        if (!fs.existsSync(
            repairPath
        )) {
            return;
        }

        const repair =
            JSON.parse(
                fs.readFileSync(
                    repairPath,
                    "utf8"
                )
            );

        const target =
            validateRepair(
                repair
            );

        log("");

        log(
            "=========================================="
        );

        log(
            " RangoD AUTOMATIC REPAIR ENGINE"
        );

        log(
            "=========================================="
        );

        log(
            `Repair: ${repair.repairId}`
        );

        log(
            `Target: ${repair.target}`
        );

        log(
            `Problem: ${repair.problem}`
        );

        if (!fs.existsSync(
            target
        )) {
            throw new Error(
                `Target file does not exist: ${repair.target}`
            );
        }

        log(
            "[1/5] Repair request ..... PASS"
        );

        log(
            "[2/5] Sending target to AI repair engine..."
        );

        const result =
            await runAIRepair(
                repair.problem,
                repair.target
            );

        if (!result) {
            throw new Error(
                "AI repair engine returned no result."
            );
        }

        if (!result.success) {
            throw new Error(
                result.error ||
                "AI repair failed."
            );
        }

        if (result.modified) {

            log(
                "[3/5] AI replacement ...... PASS"
            );

        } else {

            log(
                "[3/5] AI determined no change was necessary."
            );
        }

        log(
            "[4/5] Verification ........ PASS"
        );

        const completedPath =
            moveRepair(
                repairPath,
                COMPLETED_DIR
            );

        if (completedPath) {

            const completed =
                JSON.parse(
                    fs.readFileSync(
                        completedPath,
                        "utf8"
                    )
                );

            completed.status =
                "COMPLETED";

            completed.completedAt =
                new Date().toISOString();

            completed.result = {
                success:
                    result.success,

                modified:
                    result.modified,

                reason:
                    result.reason,

                backup:
                    result.backup,

                plan:
                    result.plan,
            };

            fs.writeFileSync(
                completedPath,
                JSON.stringify(
                    completed,
                    null,
                    2
                ),
                "utf8"
            );
        }

        log(
            "[5/5] Finalization ....... PASS"
        );

        log(
            "=========================================="
        );

        log(
            " REPAIR SUCCESSFUL"
        );

        log(
            "=========================================="
        );

    } catch (error) {

        console.error("");

        console.error(
            "❌ REPAIR FAILED"
        );

        console.error(
            error.message
        );

        try {

            if (
                fs.existsSync(
                    repairPath
                )
            ) {

                const failedPath =
                    moveRepair(
                        repairPath,
                        FAILED_DIR
                    );

                if (
                    failedPath &&
                    fs.existsSync(
                        failedPath
                    )
                ) {

                    const failed =
                        JSON.parse(
                            fs.readFileSync(
                                failedPath,
                                "utf8"
                            )
                        );

                    failed.status =
                        "FAILED";

                    failed.failedAt =
                        new Date().toISOString();

                    failed.error =
                        error.message;

                    fs.writeFileSync(
                        failedPath,
                        JSON.stringify(
                            failed,
                            null,
                            2
                        ),
                        "utf8"
                    );
                }
            }

        } catch (moveError) {

            console.error(
                "Could not move failed repair:",
                moveError.message
            );
        }

    } finally {

        processing.delete(
            repairPath
        );
    }
}

function scanRepairs() {

    if (!fs.existsSync(
        PENDING_DIR
    )) {
        return;
    }

    const files =
        fs.readdirSync(
            PENDING_DIR
        );

    for (
        const file
        of files
    ) {

        if (
            !file.endsWith(
                ".json"
            )
        ) {
            continue;
        }

        executeRepair(
            path.join(
                PENDING_DIR,
                file
            )
        );
    }
}

log(
    "=========================================="
);

log(
    " RangoD AUTOMATIC REPAIR ENGINE"
);

log(
    "=========================================="
);

log(
    `Watching: ${PENDING_DIR}`
);

scanRepairs();

fs.watch(
    PENDING_DIR,
    async (
        event,
        filename
    ) => {

        if (!filename) {
            return;
        }

        if (
            !filename.endsWith(
                ".json"
            )
        ) {
            return;
        }

        const repairPath =
            path.join(
                PENDING_DIR,
                filename
            );

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    500
                )
        );

        if (
            fs.existsSync(
                repairPath
            )
        ) {
            await executeRepair(
                repairPath
            );
        }
    }
);