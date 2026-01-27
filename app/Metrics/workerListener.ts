import { workerMetricsEmitter } from "./workerEventEmitter";
import { workerMetrics } from "./workerMetrics";

workerMetricsEmitter.on("message_consumed", () => {
    workerMetrics.consumedCount++
    console.log("✅ Consumed count:", workerMetrics.consumedCount);
});

workerMetricsEmitter.on("message_processed", (data: any) => {
    workerMetrics.processingDuration.push(data.durationMs)
    if (!data.success) workerMetrics.failedCount++
})

workerMetricsEmitter.on("message_acknowledged", (data: any) => {
    console.log(data)
    workerMetrics.ackCount++;
    workerMetrics.cpu.push(data);
    console.log(">>>>>>>>>>>>", workerMetrics)
});