import fs from "fs";
import path from "path";
import config from "./config.js";
import logger from "./logger.js";

function createBackupName(filePath) {
    const timestamp =
        new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

    const safePath = filePath
        .replace(/[\\\/]/g, "__")
        .replace(/[^a-zA-Z0-9_.-]/g, "_");

    return `${timestamp}__${safePath}`;
}

export function backupFile(filePath) {
    const sourcePath = path.resolve(
        config.projectRoot,
        filePath
    );

    if (!fs.existsSync(sourcePath)) {
        throw new Error(
            `Cannot backup missing file: ${filePath}`
        );
    }

    const stats = fs.statSync(sourcePath);

    if (!stats.isFile()) {
        throw new Error(
            `Cannot backup directory: ${filePath}`
        );
    }

    fs.mkdirSync(
        config.backupRoot,
        {
            recursive: true,
        }
    );

    const backupName =
        createBackupName(filePath);

    const backupPath = path.join(
        config.backupRoot,
        backupName
    );

    fs.copyFileSync(
        sourcePath,
        backupPath
    );

    logger.success(
        `Backup created: ${filePath}`,
        {
            backup: backupPath,
        }
    );

    return {
        original: sourcePath,
        backup: backupPath,
        relativeFile: filePath,
    };
}

export function restoreBackup(backupPath, filePath) {
    const destinationPath = path.resolve(
        config.projectRoot,
        filePath
    );

    if (!fs.existsSync(backupPath)) {
        throw new Error(
            `Backup does not exist: ${backupPath}`
        );
    }

    fs.copyFileSync(
        backupPath,
        destinationPath
    );

    logger.success(
        `Backup restored: ${filePath}`
    );

    return true;
}

export default {
    backupFile,
    restoreBackup,
};
