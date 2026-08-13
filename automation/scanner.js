import fs from "fs";
import path from "path";
import config from "./config.js";
import logger from "./logger.js";

const IGNORE_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    "backups",
    "logs",
    "dist",
    "build",
    ".next",
    ".vite",
]);

const IGNORE_FILES = new Set([
    ".DS_Store",
]);

function scanDirectory(directory, relativeBase = directory) {
    const results = [];

    if (!fs.existsSync(directory)) {
        return results;
    }

    const entries = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(
            directory,
            entry.name
        );

        const relativePath = path.relative(
            relativeBase,
            fullPath
        );

        if (entry.isDirectory()) {
            if (IGNORE_DIRECTORIES.has(entry.name)) {
                continue;
            }

            results.push({
                type: "directory",
                path: relativePath,
            });

            results.push(
                ...scanDirectory(
                    fullPath,
                    relativeBase
                )
            );

            continue;
        }

        if (IGNORE_FILES.has(entry.name)) {
            continue;
        }

        let size = 0;

        try {
            size = fs.statSync(fullPath).size;
        } catch {
            size = 0;
        }

        results.push({
            type: "file",
            path: relativePath,
            size,
            extension: path.extname(entry.name),
        });
    }

    return results;
}

export function scanProject() {
    logger.info("Starting RangoD project scan.");

    const project = {
        root: config.projectRoot,
        client: [],
        server: [],
        docs: [],
    };

    project.client = scanDirectory(
        config.clientRoot
    );

    project.server = scanDirectory(
        config.serverRoot
    );

    project.docs = scanDirectory(
        config.docsRoot
    );

    const summary = {
        clientFiles: project.client.filter(
            item => item.type === "file"
        ).length,

        serverFiles: project.server.filter(
            item => item.type === "file"
        ).length,

        docsFiles: project.docs.filter(
            item => item.type === "file"
        ).length,
    };

    logger.success(
        "Project scan completed.",
        summary
    );

    return {
        project,
        summary,
    };
}

export default scanProject;
