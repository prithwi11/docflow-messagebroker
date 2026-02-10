export class TestSQSHelper {
    constructor() {}

    pushMessageToQueue = async(params: any) => {
        const queueName = process.env.TEST_QUEUE_NAME as string;
        const amqp = require('amqplib');
        const { v4: uuidv4 } = require('uuid');

        // connect to RabbitMQ
        const connection = await amqp.connect(process.env.RABBITMQ_HOST);

        // create a channel
        const channel = await connection.createChannel();

        // create/update a queue to make sure the queue is exist
        await channel.assertQueue(queueName, {
            durable: true,
        });

        // generate correlation id, basically correlation id used to know if the message is still related with another message
        const correlationId = uuidv4();

        // const buff = Buffer.from(JSON.stringify({
        //     event_type: `ingredient-allergen`,
        //     ingredient_id:514,
        //     allergen_id:3
        // }), 'utf-8');

        const buff = Buffer.from(JSON.stringify(params), 'utf-8');


        const result = channel.sendToQueue(queueName, buff, {
            persistent: true,
            messageId: uuidv4(),
            correlationId: correlationId,
        }); 
        
        // close the channel
        await channel.close();
        // close the connection
        await connection.close(); 
    }

    purgeMessageFromQueue = async() => {
        const queueName = process.env.TEST_QUEUE_NAME as string;
        const amqp = require('amqplib');
        const connection = await amqp.connect(process.env.RABBITMQ_HOST);

        // create a channel
        const channel = await connection.createChannel();

        // create/update a queue to make sure the queue is exist
        await channel.assertQueue(queueName, {
            durable: true,
        });

        const result = await channel.purgeQueue(queueName);
        console.log(`Purged ${result.messageCount} messages from ${queueName}`);

        await channel.close();
        await connection.close();
    }
}