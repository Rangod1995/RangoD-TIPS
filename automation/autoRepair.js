import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const PLANS_DIR = path.join(ROOT, "repairs", "plans");
const BACKUP_DIR = path.join(
    ROOT,
    "repairs",
    "backups",
    new Date().toISOString().replace(/[:.]/g, "-")
);

function log(message) {
    console.log(`[AUTO-REPAIR] ${message}`);
}

function run(command, cwd = ROOT) {
    log(`Running: ${command}`);

    try {
        execSync(command, {
            cwd,
            stdio: "inherit",
            shell: true,
        });

        return true;
    } catch {
        return false;
    }
}

function getLatestPlan() {
    if (!fs.existsSync(PLANS_DIR)) {
        throw new Error(
            "repairs/plans directory does not exist."
        );
    }

    const plans = fs
        .readdirSync(PLANS_DIR)
        .filter(file => file.endsWith(".json"))
        .map(file => {
            const fullPath =
                path.join(
                    PLANS_DIR,
                    file
                );

            return {
                file,
                fullPath,
                time:
                    fs.statSync(
                        fullPath
                    ).mtimeMs,
            };
        })
        .sort(
            (a, b) =>
                b.time - a.time
        );

    if (!plans.length) {
        throw new Error(
            "No repair plan found."
        );
    }

    return plans[0];
}

function backupFile(relativeFile) {
    const source =
        path.join(
            ROOT,
            relativeFile
        );

    if (!fs.existsSync(source)) {
        log(
            `Skipping missing file: ${relativeFile}`
        );
        return;
    }

    const destination =
        path.join(
            BACKUP_DIR,
            relativeFile
        );

    fs.mkdirSync(
        path.dirname(destination),
        {
            recursive: true,
        }
    );

    fs.copyFileSync(
        source,
        destination
    );

    log(
        `Backed up: ${relativeFile}`
    );
}

function backupCandidates(
    plan
) {
    fs.mkdirSync(
        BACKUP_DIR,
        {
            recursive: true,
        }
    );

    for (
        const candidate
        of plan.candidates || []
    ) {
        backupFile(
            candidate.file
        );
    }
}

function checkJavaScriptFiles() {
    log(
        "Checking JavaScript files..."
    );

    const directories = [
        path.join(ROOT, "server"),
        path.join(ROOT, "automation"),
    ];

    let failed = false;

    function scan(directory) {
        if (
            !fs.existsSync(directory)
        ) {
            return;
        }

        for (
            const entry
            of fs.readdirSync(
                directory,
                {
                    withFileTypes: true,
                }
            )
        ) {
            if (
                entry.name ===
                    "node_modules" ||
                entry.name ===
                    "dist"
            ) {
                continue;
            }

            const fullPath =
                path.join(
                    directory,
                    entry.name
                );

            if (
                entry.isDirectory()
            ) {
                scan(fullPath);
                continue;
            }

            if (
                ![
                    ".js",
                    ".mjs",
                    ".cjs",
                ].includes(
                    path.extname(
                        entry.name
                    )
                )
            ) {
                continue;
            }

            try {
                execSync(
                    `node --check "${fullPath}"`,
                    {
                        cwd: ROOT,
                        stdio: "pipe",
                        shell: true,
                    }
                );
            } catch (error) {
                failed = true;

                console.error(
                    `Syntax error: ${fullPath}`
                );

                if (
                    error.stdout
                ) {
                    console.error(
                        error.stdout.toString()
                    );
                }

                if (
                    error.stderr
                ) {
                    console.error(
                        error.stderr.toString()
                    );
                }
            }
        }
    }

    for (
        const directory
        of directories
    ) {
        scan(directory);
    }

    return !failed;
}

function buildFrontend() {
    const client =
        path.join(
            ROOT,
            "client"
        );

    if (
        !fs.existsSync(
            client
        )
    ) {
        log(
            "Client directory not found."
        );

        return true;
    }

    return run(
        "npm run build",
        client
    );
}

function checkGitStatus() {
    try {
        execSync(
            "git status --short",
            {
                cwd: ROOT,
                stdio: "inherit",
                shell: true,
            }
        );
    } catch {
        log(
            "Git status unavailable."
        );
    }
}

function main() {
    console.log("");
    console.log(
        "=========================================="
    );
    console.log(
        " RangoD AUTOMATIC REPAIR ENGINE"
    );
    console.log(
        "=========================================="
    );
    console.log("");

    const latestPlan =
        getLatestPlan();

    log(
        `Using plan: ${latestPlan.file}`
    );

    const plan =
        JSON.parse(
            fs.readFileSync(
                latestPlan.fullPath,
                "utf8"
            )
        );

    log(
        `Task: ${plan.task}`
    );

    log(
        `Candidates: ${
            plan.candidates?.length || 0
        }`
    );

    log(
        "Creating safety backup..."
    );

    backupCandidates(plan);

    console.log("");

    log(
        `Backup created at: ${BACKUP_DIR}`
    );

    console.log("");

    log(
        "Phase 1: backend syntax validation"
    );

    const syntaxOk =
        checkJavaScriptFiles();

    if (!syntaxOk) {
        console.error("");
        console.error(
            "Backend/automation syntax errors detected."
        );
        console.error(
            "NO SOURCE FILES WERE AUTOMATICALLY MODIFIED."
        );
        console.error("");
        console.error(
            `Backup: ${BACKUP_DIR}`
        );

        process.exit(1);
    }

    console.log("");

    log(
        "Phase 2: frontend production build"
    );

    const buildOk =
        buildFrontend();

    if (!buildOk) {
        console.error("");
        console.error(
            "Frontend production build failed."
        );
        console.error(
            "NO SOURCE FILES WERE AUTOMATICALLY MODIFIED."
        );
        console.error("");
        console.error(
            `Backup: ${BACKUP_DIR}`
        );

        process.exit(1);
    }

    console.log("");

    log(
        "Phase 3: final project status"
    );

    checkGitStatus();

    console.log("");
    console.log(
        "=========================================="
    );
    console.log(
        " AUTOMATED PRE-DEPLOYMENT CHECK COMPLETE"
    );
    console.log(
        "=========================================="
    );
    console.log("");

    log(
        "No unverified source modifications were made."
    );

    log(
        "The project passed the automated syntax/build checks."
    );

    log(
        `Safety backup: ${BACKUP_DIR}`
    );

    console.log("");
}

main();
