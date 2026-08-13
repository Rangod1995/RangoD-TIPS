import { runAIRepair } from "./aiRepair.js";

const task =
    process.argv
        .slice(2)
        .join(" ")
        .trim();

if (!task) {
    console.log("");
    console.log("Usage:");
    console.log(
        'node automation\\aiRepairTest.js "describe the problem"'
    );
    process.exit(1);
}

console.log("");
console.log("==========================================");
console.log(" RangoD AI REPAIR ENGINE");
console.log("==========================================");

try {
    const result =
        await runAIRepair(task);

    console.log("");
    console.log("==========================================");
    console.log(" AI REPAIR COMPLETE");
    console.log("==========================================");

    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );
} catch (error) {
    console.error("");
    console.error("==========================================");
    console.error(" AI REPAIR FAILED");
    console.error("==========================================");

    console.error(
        error.message
    );

    process.exitCode = 1;
}
