import amqp, { Connection, Channel } from "amqplib";
import { FileController } from "./app/controllers/file_controller";
import { workerMetricsEmitter } from "./app/Metrics/workerEventEmitter";
import { buildWorkerSnapshot } from "./app/Metrics/workerSnapshot";
import { workerMetrics } from "./app/Metrics/workerMetrics";
import "./app/Metrics/workerListener"
import { AppConfig, configs } from "./config/app.config";

let appConfig: AppConfig = configs;

let connection: any;
let channel: Channel;

let processCount = 0;
let errorCount = 0;

const queue_name = appConfig.queueName;
const fileController = new FileController();

async function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

async function connectWithRetry(url: string, retries = 10, delayMs = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting RabbitMQ connection (attempt ${i + 1})`);
            const conn = await amqp.connect(url);
            console.log("Connected to RabbitMQ");
            return conn;
        } catch (err) {
            console.log("RabbitMQ connection failed, retrying...");
            await sleep(delayMs);
        }
    }
    throw new Error("Failed to connect to RabbitMQ after retries");
}

export async function startWorker(): Promise<void> {
    console.log("Registering consumer...");

    connection = await connectWithRetry(appConfig.rabbitmqHost as string);
    channel = await connection.createChannel();

    await channel.assertQueue(queue_name, { durable: true });

    await channel.assertQueue("dlq_queue", { durable: true });
    await channel.assertExchange("dlx_exchange", "direct", { durable: true });
    await channel.bindQueue("dlq_queue", "dlx_exchange", "dlq_queue");

    channel.prefetch(1);

    await new Promise<void>((resolve) => {
        channel.consume(queue_name, async (message: any) => {
            if (!message) return;

            console.log("Message received");

            try {
                const startTime = Date.now();
                const msgBody = JSON.parse(message.content.toString());

                await fileController.resizeImage(msgBody);

                const processingTime = Date.now() - startTime;
                processCount++;

                if (process.send) {
                    process.send({
                        type: "processed",
                        messageId: message.properties.messageId,
                        processingTime,
                        processCount
                    });
                }

                channel.ack(message);

            } catch (error: any) {

                errorCount++;

                if (process.send) {
                    process.send({
                        type: "error",
                        messageId: message.properties.messageId,
                        error: error.message,
                        errorCount
                    });
                }

                const headers = message.properties.headers || {};
                const retryCount = headers["x-retry-count"] || 0;

                if (retryCount < 3) {
                    channel.sendToQueue(
                        queue_name,
                        message.content,
                        {
                            headers: {
                                ...headers,
                                "x-retry-count": retryCount + 1
                            },
                            persistent: true
                        }
                    );
                    channel.ack(message);
                } else {
                    channel.nack(message, false, false);
                }
            }
        });

        resolve();
    });
}

export async function stopWorker(): Promise<void> {
    if (channel) await channel.close();
    if (connection) await connection.close();
}
