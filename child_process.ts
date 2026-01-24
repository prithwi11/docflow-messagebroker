import { fork } from "child_process";
import amqp from "amqplib"

let workers: any[] = [];

function spawnWorker() {
    const worker = fork("./worker.ts");

    worker.on('message', (msg: any) => {
        console.log(`Worker ${worker.pid}: ${msg}`);
    })

    worker.on('exit', (code) => {
        console.log(`Worker exited with code ${code}`);
        workers = workers.filter(w => w != worker);
    });

    workers.push(worker);
    return worker;
}

async function getQueueDepth() {
    const connection  = await amqp.connect(process.env.RABBITMQ_HOST as string);
    const channel = await connection.createChannel();
    const queue_name: string = process.env.QUEUE_NAME as string;
    
    const result = await channel.assertQueue(queue_name);

    const queue_depth = result.messageCount;
    console.log("QUEUE DEPTH", queue_depth);

    await channel.close();
    await connection.close();
    return queue_depth;
}

async function autoScale() {
    const queue_depth = await getQueueDepth();

    if (queue_depth > 100 && workers.length < 10) {
        console.log("Scaling up....");
        spawnWorker();
        spawnWorker();
    }
    else if (queue_depth < 20 && workers.length > 2) {
        console.log("Scaling down...")
        const worker = workers.pop()
        worker.send({ cmd: 'shutdown'});
    }
}

setInterval(autoScale, 10000);

for (let i = 0; i < 2; i++) {
    spawnWorker();
}