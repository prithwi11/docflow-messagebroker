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
        const startCpu = process.cpuUsage();
        const startHr = process.hrtime.bigint();

        const connection  = await amqp.connect(process.env.RABBITMQ_HOST as string);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue_name, {
            durable: true,
            // deadLetterExchange : 'dlx_exchange',
            // deadLetterRoutingKey : 'dl1_key',
        });

        await channel.assertQueue('dlq_queue', {
            durable : true,
        });

        await channel.assertExchange('dlx_exchange', 'direct', {durable : true});
        await channel.bindQueue('dlq_queue', 'dlx_exchange', 'dlq_queue');

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue_name);
        channel.prefetch(1);

        channel.consume(queue_name, async function (message:any) {
            console.log("[%s] Received with id (%s) message: %s", message.properties.correlationId, message.properties.messageId, message.content.toString());

            try {
                let msgBody = JSON.parse(message.content);
                await fileController.resizeImage(msgBody);
                channel.ack(message); 
            }
            catch (error: any) {
                const headers = message.properties.headers || {};
                const retryCount = headers['x-retry-count'] || 0;
                if (retryCount < 3) {
                    channel.sendToQueue(
                        queue_name,
                        message.content,
                        {
                            headers : {
                                ...headers,
                                'x-retry-count' : retryCount + 1
                            },
                            persistent : true
                        }
                    ),
                    channel.ack(message)
                }
                else {
                    channel.nack(message, false, false)
                }
                
                console.log("Worker failed, requeuing message", error);
                // channel.nack(message, false, true) //requeue = true;
            }
            const cpuUsed = process.cpuUsage(startCpu);
            const durationMs = Number(process.hrtime.bigint() - startHr) / 1e6;
            let cpu = {
                user_cpu_ms: cpuUsed.user / 1000,
                system_cpu_ms: cpuUsed.system / 1000,
                wall_ms: durationMs,
                redelivered: message.fields.redelivered
            };
            console.log("cpuUsed", cpu)
            workerMetricsEmitter.emit("message_acknowledged", cpu);

        }, {
            noAck: false
        })
    }
    catch (error: any) {
        console.log("RabbitMQ connection error in main block", error);
        process.exit()
    }
}

setInterval(async() => {
    const snapshot = await buildWorkerSnapshot();
    fs.appendFileSync(
        "./worker-metrics.json",
        JSON.stringify(snapshot) + "\n",
        { encoding: "utf-8" }
    );


    workerMetrics.ackCount = 0;
    workerMetrics.cpu = [];
}, 10_000)

consume();