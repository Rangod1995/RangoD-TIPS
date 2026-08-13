import {
    planRepair,
    printRepairPlan,
} from "./repairPlanner.js";

const task =
    process.argv
        .slice(2)
        .join(" ")
        .trim();

if (!task) {
    console.log("");
    console.log(
        "Usage:"
    );
    console.log(
        'node automation/repairPlannerTest.js "describe the problem here"'
    );
    process.exit(1);
}

try {
    const plan =
        planRepair(task);

    printRepairPlan(plan);

    console.log("");
    console.log(
        "PLANNING ONLY — NO FILES WERE MODIFIED."
    );
    console.log("");
} catch (error) {
    console.error("");
    console.error(
        "REPAIR PLANNER FAILED"
    );
    console.error(
        error.message
    );

    process.exitCode = 1;
}
