import fs from "fs"
import { buildWorkerSnapshot } from "./workerSnapshot";
import { workerMetrics } from "./workerMetrics";


setInterval(() => {
    const snapshot = buildWorkerSnapshot();
    fs.appendFileSync(
        "./api-metrics.json",
        JSON.stringify(snapshot) + "\n",
        { encoding: "utf-8" }
    );


    workerMetrics.ackCount = 0;
    workerMetrics.cpu = [];
}, 1_000)