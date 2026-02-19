import dotenv from "dotenv";
import { startWorker, stopWorker } from "./worker.core";

dotenv.config();

async function bootstrap() {
    try {
        await startWorker();
        console.log("Worker entry started successfully");
    } catch (err) {
        console.error("Worker startup failed:", err);
        process.exit(1);
    }
}

bootstrap();

process.on("SIGTERM", async () => {
    await stopWorker();
    process.exit(0);
});

process.on("SIGINT", async () => {
    await stopWorker();
    process.exit(0);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    process.exit(1);
});
