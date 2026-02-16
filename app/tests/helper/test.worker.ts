import { spawn, ChildProcess } from "child_process";
import path from "path";

export function spawnWorker() : ChildProcess {
    const projectRoot = process.cwd();
    const workerPath = path.resolve(projectRoot, "worker.ts")
    const workerProcess = spawn("npx", ["ts-node", workerPath], {
        env: {
            ...process.env,
            NODE_ENV:"test",
            TEST_QUEUE_NAME:"file-processor-test",
            TEST_DB_NAME:"docflow_test",
            S3_TEST_BUCKET: "docflow-test-bucket",
        },
        stdio: 'inherit'
    });
    
    return workerProcess;
}