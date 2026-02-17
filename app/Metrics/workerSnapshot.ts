// buildWorkerSnapshot.ts
import { workerMetrics } from "./workerMetrics";
import axios from "axios";
import os from "os"
import { monitorEventLoopDelay } from "perf_hooks";
import { AppConfig, configs } from "../../config/app.config";

let appConfig: AppConfig = configs;
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();


function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[idx];
}

async function getQueueDepth() {
    let queue_depth = 0;
    let ready_messages = 0;
    try {
      const queue_metrics: any = await axios.get(`${appConfig.rabbitmqHost}${appConfig.queueName}`, {
        auth : {username: 'guest', password : 'guest'}
      });
      queue_depth = queue_metrics.data.messages;
      ready_messages = queue_metrics.ready_messages;
    } catch (err: any) {
      console.error("❌ Failed to fetch queue depth:", err.message);
    }

  return { queue_depth };
}

async function getResourceMetrics() {
  // CPU Usage
  const cpus = os.cpus();
  const cpuPercent = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((a,b) => a+b, 0);
    return ((total - cpu.times.idle) / total) * 100;
  });
  const avgCpu = cpuPercent.reduce((a, b) => a + b, 0) / cpuPercent.length;

  // Memory Usage
  const memUsage = process.memoryUsage(); // bytes
  const rssMb = memUsage.rss / 1024 / 1024;
  const heapUsedMb = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMb = memUsage.heapTotal / 1024 / 1024;
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  // Event Loop Lag
  const eventLoopLagMs = h.mean / 1e6; // convert ns to ms
  return {
    cpu_percent: avgCpu,
    memory_rss_mb: rssMb,
    memory_heap_used_mb: heapUsedMb,
    memory_heap_total_mb: heapTotalMb,
    memory_percent: memPercent,
    event_loop_lag_ms: eventLoopLagMs
  };
}

// Export as async function
export async function buildWorkerSnapshot() {
  const queue_metrics = await getQueueDepth(); // await here!
  const { queue_depth } = queue_metrics;
  const resource_metrics: any = await getResourceMetrics();
  return {
    queue: {
      consume_rate: workerMetrics.consumedCount / 60,
      queue_depth,
      consumer_lag: queue_depth / Math.max(workerMetrics.consumedCount / 60, 1)
    },
    worker: {
      processing_time_p95: percentile(workerMetrics.processingDuration, 95),
      failed_processing_count: workerMetrics.failedCount,
    },
    track : {
      ackCount : workerMetrics.ackCount,
      cpu: workerMetrics.cpu
    }
  //   resource: {
  //     cpu_percent: resource_metrics.cpu_percent,
  //     memory_rss_mb: resource_metrics.memory_rss_mb,
  //     memory_heap_used_mb: resource_metrics.memory_heap_used_mb,
  //     memory_heap_total_mb: resource_metrics.memory_heap_total_mb,
  //     memory_percent: resource_metrics.memory_percent,
  //     event_loop_lag_ms: resource_metrics.event_loop_lag_ms,
  //     cpu_use: process.cpuUsage()
  //   }
  };
}
