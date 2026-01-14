import amqp from "amqplib"
import dotenv from "dotenv"
import { FileController } from "./app/controllers/file_controller"
import { workerMetricsEmitter } from "./app/Metrics/workerEventEmitter"
import { buildWorkerSnapshot } from "./app/Metrics/workerSnapshot"
import fs from "fs"
import { workerMetrics } from "./app/Metrics/workerMetrics"
import "./app/Metrics/workerListener"

dotenv.config()

const queue_name = process.env.QUEUE_NAME as string
const fileController = new FileController();
async function consume() {
    try {
        const connection  = await amqp.connect(process.env.RABBITMQ_HOST as string);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue_name, {
            durable: true
        });
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue_name);
        channel.prefetch(10);

        channel.consume(queue_name, async function (message:any) {
            console.log("[%s] Received with id (%s) message: %s", message.properties.correlationId, message.properties.messageId, message.content.toString());
            const startTime = Date.now()
            let msgBody = JSON.parse(message.content);

            try {
                workerMetricsEmitter.emit("message_consumed");
                await fileController.resizeImage(msgBody);
                workerMetricsEmitter.emit("message_processed", {
                    durationMs: Date.now() - startTime,
                    success: true,
                });
                channel.ack(message);
            }
            catch (error: any) {
                workerMetricsEmitter.emit("message_processed", {
                    durationMs: Date.now() - startTime,
                    success: false,
                });
                channel.nack(message);
            }
        }, {
            noAck: false
        })
    }
    catch (error: any) {
        console.log("RabbitMQ connection error in main block", error);
        process.exit()
    }
}

setInterval(async () => {
    const snapshot = await buildWorkerSnapshot();
    fs.appendFileSync("./worker-metrics.json", JSON.stringify(snapshot) + "\n");
    console.log("📊 Worker snapshot saved:", snapshot);
  
    // Optionally, reset windowed metrics
    workerMetrics.consumedCount = 0;
    workerMetrics.processingDuration = [];
    workerMetrics.failedCount = 0;
  }, 10_000); // every minute

consume();