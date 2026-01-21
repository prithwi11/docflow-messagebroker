import amqp from "amqplib"
import dotenv from "dotenv"
import { FileController } from "./app/controllers/file_controller"

dotenv.config()

//Track worker stats
let processCount = 0;
let errorCount = 0;

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
                channel.nack(message, false, false)
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

consume();