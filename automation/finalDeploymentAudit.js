import fs from "fs";
import path from "path";
import { spawn, execSync } from "child_process";

const ROOT = process.cwd();
const CLIENT = path.join(ROOT, "client");
const SERVER = path.join(ROOT, "server");

const results = [];

function pass(name, detail = "") {
    results.push({ name, status: "PASS", detail });
    console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
    results.push({ name, status: "FAIL", detail });
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

function warn(name, detail = "") {
    results.push({ name, status: "WARN", detail });
    console.log(`⚠️ ${name}${detail ? ` — ${detail}` : ""}`);
}

function commandExists(command) {
    try {
        execSync(command, {
            stdio: "ignore",
            shell: true,
        });
        return true;
    } catch {
        return false;
    }
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = await response.text();
    }

    return {
        response,
        data,
    };
}

function syntaxCheck(directory) {
    let failed = false;

    if (!fs.existsSync(directory)) {
        return true;
    }

    function scan(current) {
        for (const entry of fs.readdirSync(current, {
            withFileTypes: true,
        })) {
            if (
                entry.name === "node_modules" ||
                entry.name === "dist" ||
                entry.name === "build"
            ) {
                continue;
            }

            const full = path.join(
                current,
                entry.name
            );

            if (entry.isDirectory()) {
                scan(full);
                continue;
            }

            if (
                ![
                    ".js",
                    ".mjs",
                    ".cjs",
                ].includes(
                    path.extname(entry.name)
                )
            ) {
                continue;
            }

            try {
                execSync(
                    `node --check "${full}"`,
                    {
                        cwd: ROOT,
                        stdio: "pipe",
                        shell: true,
                    }
                );
            } catch {
                failed = true;
            }
        }
    }

    scan(directory);

    return !failed;
}

function checkEnvironment() {
    const files = [
        path.join(SERVER, ".env"),
        path.join(ROOT, ".env"),
    ];

    let found = false;

    for (const file of files) {
        if (fs.existsSync(file)) {
            found = true;

            const content =
                fs.readFileSync(
                    file,
                    "utf8"
                );

            const dangerousPatterns = [
                "PRIVATE_KEY=",
                "SECRET_KEY=",
                "PAYSTACK_SECRET",
                "JWT_SECRET=",
                "MONGO_URI=",
                "FOOTBALL_API_KEY=",
            ];

            const foundSecrets =
                dangerousPatterns.filter(
                    key =>
                        content.includes(key)
                );

            if (foundSecrets.length) {
                warn(
                    "Environment file",
                    `${path.relative(ROOT, file)} contains runtime secrets; verify it is not committed`
                );
            }
        }
    }

    if (!found) {
        warn(
            "Environment configuration",
            "No local .env file found"
        );
    } else {
        pass(
            "Environment files",
            "Local environment configuration detected"
        );
    }
}

async function main() {
    console.log("");
    console.log(
        "=========================================="
    );
    console.log(
        " RangoD TIPS FINAL DEPLOYMENT AUDIT"
    );
    console.log(
        "=========================================="
    );
    console.log("");

    console.log("1. BASIC TOOLCHAIN");

    if (commandExists("node --version")) {
        pass("Node.js");
    } else {
        fail("Node.js");
    }

    if (commandExists("npm --version")) {
        pass("npm");
    } else {
        fail("npm");
    }

    console.log("");
    console.log("2. BACKEND SOURCE");

    if (syntaxCheck(SERVER)) {
        pass(
            "Backend syntax",
            "All checked JavaScript files are valid"
        );
    } else {
        fail(
            "Backend syntax",
            "Syntax errors detected"
        );
    }

    console.log("");
    console.log("3. FRONTEND SOURCE");

    if (fs.existsSync(CLIENT)) {
        try {
            execSync(
                "npm run build",
                {
                    cwd: CLIENT,
                    stdio: "inherit",
                    shell: true,
                }
            );

            pass(
                "Frontend production build"
            );
        } catch {
            fail(
                "Frontend production build"
            );
        }
    } else {
        fail(
            "Frontend",
            "client directory missing"
        );
    }

    console.log("");
    console.log("4. ENVIRONMENT");

    checkEnvironment();

    console.log("");
    console.log("5. STARTING BACKEND");

    let serverProcess = null;

    try {
        serverProcess = spawn(
            process.execPath,
            [
                path.join(
                    SERVER,
                    "index.js"
                ),
            ],
            {
                cwd: ROOT,
                env: process.env,
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe",
                ],
                shell: false,
            }
        );

        let output = "";

        serverProcess.stdout.on(
            "data",
            data => {
                output += data.toString();
            }
        );

        serverProcess.stderr.on(
            "data",
            data => {
                output += data.toString();
            }
        );

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    5000
                )
        );

        let running = true;

        try {
            process.kill(
                serverProcess.pid,
                0
            );
        } catch {
            running = false;
        }

        if (running) {
            pass(
                "Backend startup",
                "Server process is running"
            );
        } else {
            fail(
                "Backend startup",
                output.slice(-2000)
            );
        }
    } catch (error) {
        fail(
            "Backend startup",
            error.message
        );
    }

    console.log("");
    console.log("6. API SMOKE TESTS");

    const tests = [
        {
            name: "Health API",
            url: "http://localhost:5000/api/health",
            validate: data =>
                data?.success === true,
        },
        {
            name: "Predictions API",
            url: "http://localhost:5000/api/predictions",
            validate: data =>
                data?.success === true &&
                Array.isArray(data?.data),
        },
        {
            name: "Matches API",
            url: "http://localhost:5000/api/matches",
            validate: data =>
                data?.success === true &&
                Array.isArray(data?.matches),
        },
    ];

    let prediction = null;

    for (const test of tests) {
        try {
            const {
                response,
                data,
            } = await request(test.url);

            if (
                response.ok &&
                test.validate(data)
            ) {
                pass(
                    test.name,
                    `HTTP ${response.status}`
                );

                if (
                    test.name ===
                    "Predictions API"
                ) {
                    prediction =
                        data.data?.[0] ||
                        null;
                }
            } else {
                fail(
                    test.name,
                    `HTTP ${response.status}`
                );
            }
        } catch (error) {
            fail(
                test.name,
                error.message
            );
        }
    }

    console.log("");
    console.log(
        "7. PREDICTION DETAILS FLOW"
    );

    if (prediction?._id) {
        try {
            const {
                response,
                data,
            } = await request(
                `http://localhost:5000/api/predictions/${prediction._id}`
            );

            if (
                response.ok &&
                data?.success &&
                data?.data?._id ===
                    prediction._id
            ) {
                pass(
                    "Prediction Details API",
                    `Mongo _id ${prediction._id}`
                );
            } else {
                fail(
                    "Prediction Details API",
                    `HTTP ${response.status}`
                );
            }
        } catch (error) {
            fail(
                "Prediction Details API",
                error.message
            );
        }
    } else {
        warn(
            "Prediction Details API",
            "No prediction returned to test"
        );
    }

    console.log("");
    console.log("8. PREDICTION ID INTEGRITY");

    if (prediction) {
        if (
            prediction._id &&
            prediction.fixtureId
        ) {
            pass(
                "Prediction identifiers",
                `Mongo _id=${prediction._id}, fixtureId=${prediction.fixtureId}`
            );
        } else {
            fail(
                "Prediction identifiers",
                "Prediction is missing _id or fixtureId"
            );
        }
    }

    console.log("");
    console.log("9. SECURITY / DEPLOYMENT FILES");

    const gitignore =
        path.join(
            ROOT,
            ".gitignore"
        );

    if (
        fs.existsSync(gitignore)
    ) {
        const content =
            fs.readFileSync(
                gitignore,
                "utf8"
            );

        if (
            content.includes(".env")
        ) {
            pass(
                ".env git protection"
            );
        } else {
            warn(
                ".env git protection",
                ".env is not explicitly ignored"
            );
        }
    } else {
        warn(
            ".gitignore",
            ".gitignore not found"
        );
    }

    console.log("");
    console.log(
        "=========================================="
    );
    console.log(
        " FINAL DEPLOYMENT AUDIT RESULT"
    );
    console.log(
        "=========================================="
    );
    console.log("");

    const passed =
        results.filter(
            r => r.status === "PASS"
        ).length;

    const failed =
        results.filter(
            r => r.status === "FAIL"
        ).length;

    const warnings =
        results.filter(
            r => r.status === "WARN"
        ).length;

    console.log(
        `PASS: ${passed}`
    );

    console.log(
        `FAIL: ${failed}`
    );

    console.log(
        `WARN: ${warnings}`
    );

    console.log("");

    if (failed === 0) {
        console.log(
            "🟢 DEPLOYMENT GATE: PASSED"
        );
        console.log(
            "No automated deployment blockers were detected."
        );
    } else {
        console.log(
            "🔴 DEPLOYMENT GATE: FAILED"
        );
        console.log(
            "Deployment blockers were detected."
        );
    }

    console.log("");

    if (serverProcess) {
        serverProcess.kill();
    }

    process.exit(
        failed === 0 ? 0 : 1
    );
}

main().catch(error => {
    console.error("");
    console.error(
        "FINAL AUDIT ERROR:"
    );
    console.error(error);
    process.exit(1);
});
