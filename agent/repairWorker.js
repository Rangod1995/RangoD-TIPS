import fs from "fs";
import path from "path";

const ROOT = path.resolve(".");
const PENDING_DIR = path.join(ROOT, "repairs", "pending");
const PROCESSING_DIR = path.join(ROOT, "repairs", "processing");
const COMPLETED_DIR = path.join(ROOT, "repairs", "completed");
const FAILED_DIR = path.join(ROOT, "repairs", "failed");
const BACKUP_DIR = path.join(ROOT, "repairs", "backups");

for (const dir of [
    PENDING_DIR,
    PROCESSING_DIR,
    COMPLETED_DIR,
    FAILED_DIR,
    BACKUP_DIR
]) {
    fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
    return new Date()
        .toISOString()
        .replace(/[:.]/g, "-");
}

function safePath(relativePath) {
    const absolute = path.resolve(ROOT, relativePath);
    const root = path.resolve(ROOT);

    if (
        absolute !== root &&
        !absolute.startsWith(root + path.sep)
    ) {
        throw new Error(
            `Unsafe target path rejected: ${relativePath}`
        );
    }

    return absolute;
}

function createBackup(target) {
    if (!fs.existsSync(target)) {
        throw new Error(
            `Target file does not exist: ${target}`
        );
    }

    const name =
        `${timestamp()}__${path.basename(target)}.backup`;

    const backup =
        path.join(BACKUP_DIR, name);

    fs.copyFileSync(target, backup);

    return backup;
}

function moveFile(source, destinationDirectory) {
    const destination =
        path.join(
            destinationDirectory,
            path.basename(source)
        );

    fs.renameSync(
        source,
        destination
    );

    return destination;
}

function processRepair(file) {
    const pendingPath =
        path.join(PENDING_DIR, file);

    let repair;

    try {
        repair =
            JSON.parse(
                fs.readFileSync(
                    pendingPath,
                    "utf8"
                )
            );
    } catch (error) {
        console.error(
            `❌ Invalid repair request: ${file}`
        );

        console.error(
            error.message
        );

        moveFile(
            pendingPath,
            FAILED_DIR
        );

        return;
    }

    console.log("");
    console.log("==========================================");
    console.log(" RangoD REPAIR WORKER");
    console.log("==========================================");

    console.log(
        `Repair: ${repair.repairId}`
    );

    console.log(
        `Problem: ${repair.problem}`
    );

    console.log(
        `Target: ${repair.target}`
    );

    /*
     * IMPORTANT:
     *
     * At this stage we DO NOT modify the project.
     *
     * The worker prepares and validates the request.
     * The AI repair provider will supply the replacement.
     */

    repair.status = "READY_FOR_AI";
    repair.workerUpdatedAt =
        new Date().toISOString();

    fs.writeFileSync(
        pendingPath,
        JSON.stringify(
            repair,
            null,
            2
        ),
        "utf8"
    );

    console.log("");
    console.log(
        "✅ Repair request validated."
    );

    console.log(
        "Status: READY_FOR_AI"
    );

    console.log(
        "No project file was modified."
    );

    console.log(
        "Waiting for the AI repair provider."
    );

    console.log(
        "=========================================="
    );
}

function scan() {
    const files =
        fs.readdirSync(
            PENDING_DIR
        )
        .filter(
            file =>
                file.endsWith(".json")
        );

    if (!files.length) {
        console.log(
            "No pending repair requests."
        );
        return;
    }

    for (const file of files) {
        processRepair(file);
    }
}

console.log("");
console.log("==========================================");
console.log(" RangoD REPAIR WORKER V1");
console.log("==========================================");

console.log(
    `Watching: ${PENDING_DIR}`
);

console.log("");

scan();

console.log("");
console.log(
    "Worker scan complete."
);
