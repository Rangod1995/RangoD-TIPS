import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");

export const config = {
    projectRoot: PROJECT_ROOT,

    automationRoot: __dirname,

    clientRoot: path.join(PROJECT_ROOT, "client"),

    serverRoot: path.join(PROJECT_ROOT, "server"),

    docsRoot: path.join(PROJECT_ROOT, "docs"),

    backupRoot: path.join(__dirname, "backups"),

    logRoot: path.join(__dirname, "logs"),

    allowedRoots: [
        path.join(PROJECT_ROOT, "client"),
        path.join(PROJECT_ROOT, "server"),
        path.join(PROJECT_ROOT, "docs"),
    ],

    protectedRoots: [
        path.join(PROJECT_ROOT, "node_modules"),
        path.join(PROJECT_ROOT, ".git"),
        path.join(PROJECT_ROOT, "automation", "backups"),
        path.join(PROJECT_ROOT, "automation", "logs"),
    ],

    maxFileSize: 5 * 1024 * 1024,

    logFile: path.join(
        __dirname,
        "logs",
        "agent.log"
    ),
};

export default config;
