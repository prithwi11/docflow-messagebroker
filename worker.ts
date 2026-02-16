import amqp from "amqplib"
import dotenv from "dotenv"
import { FileController } from "./app/controllers/file_controller"
import { workerMetricsEmitter } from "./app/Metrics/workerEventEmitter"
import { buildWorkerSnapshot } from "./app/Metrics/workerSnapshot"
import fs from "fs"
import { workerMetrics } from "./app/Metrics/workerMetrics"
import "./app/Metrics/workerListener"
import { AppConfig, configs } from "./config/app.config"
dotenv.config()

let appConfig: AppConfig = configs;

//Track worker stats
let processCount = 0;
let errorCount = 0;

const queue_name = appConfig.queueName
const fileController = new FileController();
async function consume() {
    try {
        const startCpu = process.cpuUsage();
        const startHr = process.hrtime.bigint();

        const connection  = await amqp.connect(appConfig.rabbitmqHost as string);
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
                const startTime = Date.now();
                let msgBody = JSON.parse(message.content);
                await fileController.resizeImage(msgBody);
                const processingTime = Date.now() - startTime;
                processCount++;

                //Send Metrics to the parent
                if (process.send) {
                    process.send({type : 'processed', messageId : message.properties.messageId, processingTime, processCount});
                }
                console.log(`[${process.pid}] Processed in ${processingTime}ms (total: ${processCount})`);
                channel.ack(message);
            }
            catch (error: any) {
                errorCount++;
                if (process.send) {
                    process.send({type : 'error', messageId : message.properties.messageId, error: error.message, errorCount});
                }
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
            }            
        }, {
            noAck: false
        });

        //Graceful shutdown handler
        process.on('message', async(msg: any) => {
            if (msg.cmd == "shutdown") {
                console.log(`[${process.pid}] Graceful shutdown initiated...`);
                await channel.close();
                await connection.close();
                process.exit(0);
            }
        });

        //Handle connection errors
        connection.on('error', (err) => {
            console.error(`[${process.pid}] Connection error:`, err);
            process.exit(1);
        });

        connection.on('close', () => {
            console.log(`[${process.pid}] Connection closed`);
            process.exit(1);
        })
    }
    catch (error: any) {
        console.log("RabbitMQ connection error in main block", error);
        process.exit()
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(`[${process.pid}] Uncaught exception:`, error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${process.pid}] Unhandled rejection:`, reason);
    process.exit(1);
});
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