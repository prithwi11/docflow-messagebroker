import amqp from "amqplib"
import dotenv from "dotenv"
import { FileController } from "./app/controllers/file_controller"

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
        channel.prefetch(1);

        channel.consume(queue_name, async function (message:any) {
            console.log("[%s] Received with id (%s) message: %s", message.properties.correlationId, message.properties.messageId, message.content.toString());

            let msgBody = JSON.parse(message.content);
            await fileController.resizeImage(msgBody);
            channel.ack(message);
        }, {
            noAck: false
        })
    }
    catch (error: any) {
        console.log("RabbitMQ connection error in main block", error);
        process.exit()
    }
}

consume();