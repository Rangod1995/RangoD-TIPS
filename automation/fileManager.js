import fs from "fs";
import path from "path";
import config from "./config.js";
import logger from "./logger.js";

function resolveProjectPath(filePath) {
    const absolutePath = path.resolve(
        config.projectRoot,
        filePath
    );

    const normalized = absolutePath.toLowerCase();

    const allowed = config.allowedRoots.some(root =>
        normalized.startsWith(
            path.resolve(root).toLowerCase() + path.sep
        )
    );

    if (!allowed) {
        throw new Error(
            `Access denied. File is outside allowed project roots: ${filePath}`
        );
    }

    for (const protectedRoot of config.protectedRoots) {
        const protectedPath =
            path.resolve(protectedRoot).toLowerCase();

        if (
            normalized === protectedPath ||
            normalized.startsWith(protectedPath + path.sep)
        ) {
            throw new Error(
                `Access denied. Protected path: ${filePath}`
            );
        }
    }

    return absolutePath;
}

export function fileExists(filePath) {
    const absolutePath = resolveProjectPath(filePath);
    return fs.existsSync(absolutePath);
}

export function readFile(filePath) {
    const absolutePath = resolveProjectPath(filePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `File does not exist: ${filePath}`
        );
    }

    const stats = fs.statSync(absolutePath);

    if (!stats.isFile()) {
        throw new Error(
            `Path is not a file: ${filePath}`
        );
    }

    if (stats.size > config.maxFileSize) {
        throw new Error(
            `File exceeds maximum allowed size: ${filePath}`
        );
    }

    const content = fs.readFileSync(
        absolutePath,
        "utf8"
    );

    logger.info(
        `File read: ${filePath}`,
        {
            size: stats.size,
        }
    );

    return content;
}

export function writeFile(filePath, content) {
    const absolutePath = resolveProjectPath(filePath);

    if (typeof content !== "string") {
        throw new Error(
            "File content must be a string."
        );
    }

    if (
        Buffer.byteLength(content, "utf8") >
        config.maxFileSize
    ) {
        throw new Error(
            `Content exceeds maximum allowed size: ${filePath}`
        );
    }

    fs.mkdirSync(
        path.dirname(absolutePath),
        {
            recursive: true,
        }
    );

    fs.writeFileSync(
        absolutePath,
        content,
        "utf8"
    );

    logger.success(
        `File written: ${filePath}`
    );

    return true;
}

export function getFileInfo(filePath) {
    const absolutePath = resolveProjectPath(filePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `File does not exist: ${filePath}`
        );
    }

    const stats = fs.statSync(absolutePath);

    return {
        path: filePath,
        absolutePath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        modifiedAt: stats.mtime.toISOString(),
    };
}

export function deleteFile(filePath) {
    throw new Error(
        "Automatic file deletion is disabled in RangoD Agent V1."
    );
}

export default {
    fileExists,
    readFile,
    writeFile,
    getFileInfo,
    deleteFile,
};
