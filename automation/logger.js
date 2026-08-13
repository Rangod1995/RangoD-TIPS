import fs from "fs";
import config from "./config.js";

function ensureLogDirectory() {
    fs.mkdirSync(config.logRoot, {
        recursive: true,
    });
}

function writeLog(level, message, data = null) {
    ensureLogDirectory();

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    if (data !== null) {
        entry.data = data;
    }

    const line = JSON.stringify(entry);

    fs.appendFileSync(
        config.logFile,
        line + "\n",
        "utf8"
    );

    console.log(
        `[${entry.timestamp}] [${level}] ${message}`
    );

    if (data !== null) {
        console.log(data);
    }
}

export const logger = {
    info(message, data = null) {
        writeLog("INFO", message, data);
    },

    warn(message, data = null) {
        writeLog("WARN", message, data);
    },

    error(message, data = null) {
        writeLog("ERROR", message, data);
    },

    success(message, data = null) {
        writeLog("SUCCESS", message, data);
    },
};

export default logger;
