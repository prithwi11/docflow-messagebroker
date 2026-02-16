import dotenv from "dotenv"
dotenv.config()
export interface AppConfig {
    imagePath: string,
    s3Bucket: string,
    dbName: string,
    queueName: string,
    environment: string,
    mongoUri: string,
    rabbitmqHost: string,
}

function loadConfig(): AppConfig {
    const env: string = process.env.NODE_ENV as string;
    console.log("env", env)
    const configs: Record<string, AppConfig> = {
        production: {
            imagePath: process.env.IMAGE_PATH as string,
            s3Bucket: process.env.S3_BUCKET as string,
            dbName: process.env.DB_NAME as string,
            queueName: process.env.QUEUE_NAME as string,
            mongoUri: process.env.MONGODB_URI as string,
            rabbitmqHost: process.env.RABBITMQ_HOST as string,
            environment: 'production'
        },
        staging: {
            imagePath: process.env.IMAGE_PATH as string,
            s3Bucket: process.env.S3_BUCKET as string,
            dbName: process.env.DB_NAME as string,
            queueName: process.env.QUEUE_NAME as string,
            mongoUri: process.env.MONGODB_URI as string,
            rabbitmqHost: process.env.RABBITMQ_HOST as string,
            environment: 'staging'
        },
        development: {
            imagePath: process.env.IMAGE_PATH as string,
            s3Bucket: process.env.S3_BUCKET as string,
            dbName: process.env.DB_NAME as string,
            queueName: process.env.QUEUE_NAME as string,
            mongoUri: process.env.MONGODB_URI as string,
            rabbitmqHost: process.env.RABBITMQ_HOST as string,
            environment: 'development'
        },
        test: {
            imagePath: process.env.TEST_IMAGE_PATH as string,
            s3Bucket: process.env.S3_TEST_BUCKET as string,
            dbName: process.env.TEST_DB_NAME as string,
            queueName: process.env.TEST_QUEUE_NAME as string,
            mongoUri: process.env.MONGODB_URI as string,
            rabbitmqHost: process.env.RABBITMQ_HOST as string,
            environment: 'test'
        },
    }

    const config = configs[env];
    if (!config) {
        throw new Error(`Configuration for environment "${env}" not found.`);
    }
    return config;
}

export const configs = loadConfig();