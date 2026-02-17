import amqp from "amqplib"
import dotenv from "dotenv"
import { AppConfig, configs } from "./config/app.config";

dotenv.config();

let appConfig: AppConfig = configs;

async function sendDuplicateMessage() {
    const connection = await amqp.connect(appConfig.rabbitmqHost as string)
    const channel = await connection.createChannel()
    const queue_name = appConfig.queueName as string

    await channel.assertQueue(queue_name, {durable: true});

    const testMessage = {
        image_id: "49b07d11-66d8-46fa-841d-e368b0433e9c" //The first image_id with status uploaded
    }

    const messageBuffer = Buffer.from(JSON.stringify(testMessage));
    console.log(`Sending duplicate message to create race condition...`)

    channel.sendToQueue(queue_name, messageBuffer, {
        persistent : true,
        correlationId: "test-correlation-1",
        messageId: "msg-1"
    });

    channel.sendToQueue(queue_name, messageBuffer, {
        persistent : true,
        correlationId: "test-correlation-2",
        messageId: "msg-2"
    });

    console.log("Sent 2 duplicate messages for image_id: test_race_123");

    setTimeout(() => {
        connection.close();
        process.exit(0)
    }, 1000);
}

sendDuplicateMessage();
