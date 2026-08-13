import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

const EXTENSIONS = [
    ".js",
    ".jsx",
    ".mjs",
    ".cjs"
];

function normalizePath(value) {
    return String(value || "")
        .replace(/\\/g, "/");
}

function stripExtension(value) {
    return String(value || "")
        .replace(/\.(js|jsx|mjs|cjs)$/i, "");
}

function resolveLocalImport(
    sourceFile,
    importPath
) {
    if (!importPath.startsWith(".")) {
        return null;
    }

    const sourceDirectory =
        path.dirname(sourceFile);

    const basePath =
        path.resolve(
            sourceDirectory,
            importPath
        );

    const candidates = [
        basePath,
        ...EXTENSIONS.map(
            extension =>
                `${basePath}${extension}`
        ),
        ...EXTENSIONS.map(
            extension =>
                path.join(
                    basePath,
                    `index${extension}`
                )
        )
    ];

    for (const candidate of candidates) {
        if (
            fs.existsSync(candidate) &&
            fs.statSync(candidate).isFile()
        ) {
            return candidate;
        }
    }

    return null;
}

function extractImports(content) {
    const imports = [];

    const importRegex =
        /(?:import\s+(?:[\s\S]*?\s+from\s+)?|require\s*\(\s*)["']([^"']+)["']/g;

    let match;

    while (
        (match =
            importRegex.exec(content))
    ) {
        imports.push(match[1]);
    }

    return [
        ...new Set(imports)
    ];
}

function extractRouteReferences(content) {
    const references = [];

    const patterns = [
        /app\.(?:use|get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/g,
        /router\.(?:get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/g
    ];

    for (const regex of patterns) {
        let match;

        while (
            (match =
                regex.exec(content))
        ) {
            references.push(
                match[1]
            );
        }
    }

    return [
        ...new Set(references)
    ];
}

function analyzeFile(filePath) {
    const absolutePath =
        path.resolve(
            config.projectRoot,
            filePath
        );

    if (
        !fs.existsSync(absolutePath) ||
        !fs.statSync(absolutePath).isFile()
    ) {
        return null;
    }

    const content =
        fs.readFileSync(
            absolutePath,
            "utf8"
        );

    const imports =
        extractImports(content);

    const resolvedImports = [];

    for (const imported of imports) {
        const resolved =
            resolveLocalImport(
                absolutePath,
                imported
            );

        if (resolved) {
            resolvedImports.push({
                import: imported,
                file: normalizePath(
                    path.relative(
                        config.projectRoot,
                        resolved
                    )
                )
            });
        }
    }

    return {
        file:
            normalizePath(
                path.relative(
                    config.projectRoot,
                    absolutePath
                )
            ),
        imports,
        resolvedImports,
        routes:
            extractRouteReferences(
                content
            )
    };
}

function findRelatedFiles(
    startingFile,
    maxDepth = 3
) {
    const visited =
        new Set();

    const queue = [
        {
            file: path.resolve(
                config.projectRoot,
                startingFile
            ),
            depth: 0
        }
    ];

    const graph = [];

    while (queue.length > 0) {
        const current =
            queue.shift();

        const normalized =
            normalizePath(
                path.relative(
                    config.projectRoot,
                    current.file
                )
            );

        if (
            visited.has(normalized)
        ) {
            continue;
        }

        visited.add(normalized);

        const analysis =
            analyzeFile(
                normalized
            );

        if (!analysis) {
            continue;
        }

        graph.push(analysis);

        if (
            current.depth >=
            maxDepth
        ) {
            continue;
        }

        for (
            const dependency
            of analysis.resolvedImports
        ) {
            queue.push({
                file: path.resolve(
                    config.projectRoot,
                    dependency.file
                ),
                depth:
                    current.depth + 1
            });
        }
    }

    return graph;
}

function analyzeDependencies(
    startingFile
) {
    logger.info(
        "Analyzing dependency chain.",
        {
            startingFile
        }
    );

    const graph =
        findRelatedFiles(
            startingFile,
            4
        );

    return {
        startingFile:
            normalizePath(
                startingFile
            ),
        fileCount:
            graph.length,
        graph
    };
}

export {
    analyzeDependencies,
    findRelatedFiles,
    analyzeFile,
    extractImports
};

export default {
    analyzeDependencies,
    findRelatedFiles,
    analyzeFile,
    extractImports
};
