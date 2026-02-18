import { spawn, ChildProcess } from "child_process";
import path from "path";

export function spawnWorker(): ChildProcess {
    const projectRoot = process.cwd();
    const workerPath = path.resolve(projectRoot, "dist/worker.js");

    const workerProcess = spawn("node", [workerPath], {
        env: {
            ...process.env,
            NODE_ENV: "test",
            TEST_QUEUE_NAME: "file-processor-test",
            TEST_DB_NAME: "docflow_test",
            S3_TEST_BUCKET: "docflow-test-bucket",
        },
        stdio: "inherit",
    });

    workerProcess.on("error", (err) => {
        console.error("Worker failed to start:", err);
    });

    workerProcess.on("exit", (code) => {
        console.log("Worker exited with code:", code);
    });

    return workerProcess;
}
