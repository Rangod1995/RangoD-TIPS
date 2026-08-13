import fs from "fs";
import path from "path";

import config from "./config.js";
import logger from "./logger.js";

import { planRepair } from "./repairPlanner.js";
import { readFile } from "./fileManager.js";
import { replaceFile } from "./replacementManager.js";
import { runVerification } from "./testRunner.js";

function extractJson(text) {
    const cleaned = String(text || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
        throw new Error("AI response did not contain valid JSON.");
    }

    return JSON.parse(
        cleaned.slice(start, end + 1)
    );
}

async function callAI(task, filePath, currentContent) {
    const apiKey =
        process.env.RANGOD_AI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "RANGOD_AI_API_KEY is not configured."
        );
    }

    const apiUrl =
        process.env.RANGOD_AI_API_URL ||
        "https://api.openai.com/v1/chat/completions";

    const model =
        process.env.RANGOD_AI_MODEL ||
        "gpt-5.6";

    const prompt = `
You are the RangoD TIPS automated software repair engineer.

Task:
${task}

Target file:
${filePath}

Current file:
<<<FILE_START>>>
${currentContent}
<<<FILE_END>>>

Return ONLY valid JSON:

{
  "shouldModify": true,
  "reason": "short explanation",
  "replacement": "COMPLETE FILE CONTENT"
}

Rules:
- Return the COMPLETE file.
- Never return partial code.
- Preserve existing functionality.
- Make the smallest safe change.
- Do not modify unrelated functionality.
- Do not invent unnecessary imports.
`;

    const response = await fetch(
        apiUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a senior software engineer performing safe automated code repairs.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0,
            }),
        }
    );

    if (!response.ok) {
        const body = await response.text();

        throw new Error(
            `AI API failed (${response.status}): ${body}`
        );
    }

    const data = await response.json();

    const content =
        data?.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error(
            "AI returned an empty response."
        );
    }

    return extractJson(content);
}

async function repairFile(task, filePath) {
    const absolutePath =
        path.resolve(
            config.projectRoot,
            filePath
        );

    const currentContent =
        readFile(filePath);

    logger.info(
        "Sending file to AI repair engine.",
        {
            filePath,
        }
    );

    const aiResult =
        await callAI(
            task,
            filePath,
            currentContent
        );

    if (!aiResult.shouldModify) {
        return {
            success: true,
            modified: false,
            reason: aiResult.reason,
        };
    }

    if (
        typeof aiResult.replacement !==
        "string"
    ) {
        throw new Error(
            "AI did not return complete replacement content."
        );
    }

    if (
        aiResult.replacement.trim() ===
        currentContent.trim()
    ) {
        return {
            success: true,
            modified: false,
            reason: "No effective change generated.",
        };
    }

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `Target file does not exist: ${filePath}`
        );
    }

    const replacement =
        replaceFile(
            filePath,
            aiResult.replacement
        );

    try {
        await runVerification();

        logger.success(
            "AI repair passed verification.",
            {
                filePath,
            }
        );

        return {
            success: true,
            modified: true,
            filePath,
            reason: aiResult.reason,
            backup: replacement.backup,
        };
    } catch (verificationError) {
        logger.error(
            "Verification failed. Rolling back.",
            {
                filePath,
                error:
                    verificationError.message,
            }
        );

        fs.copyFileSync(
            replacement.backup,
            absolutePath
        );

        logger.success(
            "Automatic rollback completed.",
            {
                filePath,
            }
        );

        throw new Error(
            `Repair rolled back: ${verificationError.message}`
        );
    }
}

async function runAIRepair(
    task,
    selectedFile = null
) {
    if (!task || !String(task).trim()) {
        throw new Error(
            "Repair task is required."
        );
    }

    const plan =
        planRepair(task);

    const targetFile =
        selectedFile ||
        plan.recommendedFile;

    if (!targetFile) {
        throw new Error(
            "No suitable target file was found."
        );
    }

    logger.info(
        "AI repair target selected.",
        {
            targetFile,
            confidence: plan.confidence,
        }
    );

    const result =
        await repairFile(
            task,
            targetFile
        );

    return {
        ...result,
        plan,
    };
}

export {
    callAI,
    repairFile,
    runAIRepair,
};

export default {
    callAI,
    repairFile,
    runAIRepair,
};
