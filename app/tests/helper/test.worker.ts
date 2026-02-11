import { spawn, ChildProcess } from "child_process";

export function spawnWorker() : ChildProcess {
    const workerProcess = spawn("npx", ["ts-node", "worker.ts"], {
        env: {
            ...process.env,
            NODE_ENV:"test",
            TEST_QUEUE_NAME:"file-processor-test",
            TEST_DB_NAME:"docflow_test",
            S3_TEST_BUCKET: "docflow-test-bucket"
        },
        stdio: 'inherit'
    });
    
    return workerProcess;
}