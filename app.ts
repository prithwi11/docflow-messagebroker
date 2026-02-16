import { Connection } from "./config/connection";
import amqp from "amqplib"
import http from "http"
import dotenv from "dotenv"
dotenv.config();

let mongoReady = false
let rabbitReady = false

async function setMongoReady(status: boolean) {
    mongoReady = status;
}

async function setRabbitReady(status: boolean) {
    rabbitReady = status
}

function startHealthServer(port: number) {
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            if (mongoReady && rabbitReady) {
                res.writeHead(200)
                res.end("Ok")
            }
            else {
                res.writeHead(503)
                res.end("Not Ready")
            }
        }
        else {
            res.writeHead(404)
            res.end()
        }
    })
}


async function startup() {
    try {
        startHealthServer(3001)

        const connectToMongo = await new Connection().connect();
        if (connectToMongo) {
            setMongoReady(true);
        }
        const connection  = await amqp.connect(process.env.RABBITMQ_HOST as string);
        if (connection) {
            setRabbitReady(true);
        }

        console.log("Worker started successfully");
    }
    catch (error: any) {
        console.error("Startup failed : ", error);
        process.exit();
    }
}
startup();