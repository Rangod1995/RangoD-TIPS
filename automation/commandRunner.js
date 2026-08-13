import fs from "fs";
import path from "path";
import { spawn } from "child_process";

import config from "./config.js";
import logger from "./logger.js";

function runCommand(
    command,
    args = [],
    options = {}
) {
    const {
        cwd = config.projectRoot,
        timeout = 120000,
        allowFailure = false,
    } = options;

    return new Promise((resolve, reject) => {
        logger.info(
            `Executing command: ${command} ${args.join(" ")}`
        );

        const child = spawn(
            command,
            args,
            {
                cwd,
                shell: false,
                windowsHide: true,
                env: {
                    ...process.env,
                },
            }
        );

        let stdout = "";
        let stderr = "";
        let finished = false;

        const timer = setTimeout(() => {
            if (finished) return;

            finished = true;

            try {
                child.kill();
            } catch {}

            const error = new Error(
                `Command timed out after ${timeout}ms: ${command}`
            );

            logger.error(error.message);

            reject(error);
        }, timeout);

        child.stdout.on(
            "data",
            data => {
                const text =
                    data.toString();

                stdout += text;

                process.stdout.write(text);
            }
        );

        child.stderr.on(
            "data",
            data => {
                const text =
                    data.toString();

                stderr += text;

                process.stderr.write(text);
            }
        );

        child.on(
            "error",
            error => {
                if (finished) return;

                finished = true;
                clearTimeout(timer);

                logger.error(
                    `Command execution error: ${error.message}`
                );

                reject(error);
            }
        );

        child.on(
            "close",
            code => {
                if (finished) return;

                finished = true;
                clearTimeout(timer);

                const result = {
                    command,
                    args,
                    code,
                    success: code === 0,
                    stdout,
                    stderr,
                };

                if (code === 0) {
                    logger.success(
                        `Command completed successfully: ${command}`
                    );

                    resolve(result);
                    return;
                }

                logger.error(
                    `Command failed with exit code ${code}: ${command}`
                );

                if (allowFailure) {
                    resolve(result);
                    return;
                }

                const error = new Error(
                    `Command failed: ${command} ${args.join(" ")}`
                );

                error.result = result;

                reject(error);
            }
        );
    });
}

export {
    runCommand,
};

export default {
    runCommand,
};
