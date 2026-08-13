import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

import {
    readFile,
    writeFile,
} from "./fileManager.js";

import {
    backupFile,
    restoreBackup,
} from "./backupManager.js";

export function replaceFile(filePath, newContent) {
    if (typeof newContent !== "string") {
        throw new Error(
            "Replacement content must be a string."
        );
    }

    const absolutePath = path.resolve(
        config.projectRoot,
        filePath
    );

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `Cannot replace missing file: ${filePath}`
        );
    }

    logger.info(
        `Preparing safe replacement: ${filePath}`
    );

    const originalContent = readFile(filePath);

    const backup = backupFile(filePath);

    try {
        writeFile(
            filePath,
            newContent
        );

        const verifiedContent =
            readFile(filePath);

        if (verifiedContent !== newContent) {
            throw new Error(
                "Replacement verification failed."
            );
        }

        logger.success(
            `File replacement completed: ${filePath}`,
            {
                backup: backup.backup,
                originalSize: originalContent.length,
                newSize: newContent.length,
            }
        );

        return {
            success: true,
            filePath,
            backup: backup.backup,
            originalSize: originalContent.length,
            newSize: newContent.length,
        };
    } catch (error) {
        logger.error(
            `Replacement failed. Restoring backup: ${filePath}`,
            {
                error: error.message,
            }
        );

        restoreBackup(
            backup.backup,
            filePath
        );

        logger.success(
            `Original file restored: ${filePath}`
        );

        throw error;
    }
}

export function restoreFile(
    filePath,
    backupPath
) {
    restoreBackup(
        backupPath,
        filePath
    );

    return {
        success: true,
        filePath,
        restoredFrom: backupPath,
    };
}

export default {
    replaceFile,
    restoreFile,
};
