Image Processing Worker Service
Overview

This service consumes image processing jobs from RabbitMQ and performs CPU-intensive operations such as resizing, compression, and watermarking.

The worker is designed to run as part of a distributed processing cluster, allowing image processing workloads to scale horizontally without blocking the API service.

Instead of processing images during the request lifecycle, jobs are executed asynchronously by worker processes.

Role in the System

The worker service is responsible for:

• consuming image processing tasks from RabbitMQ
• performing image transformations using Sharp
• updating job status in the database
• acknowledging messages after successful processing
• retrying failed jobs with bounded retries
• isolating failed jobs using a Dead Letter Queue

This architecture ensures reliable and scalable background processing.

Worker Processing Flow

Processing pipeline:

1. Worker subscribes to RabbitMQ queue
2. Receives image processing job
3. Claims job atomically in database
4. Reads image from disk/storage
5. Processes image using Sharp
6. Writes processed image to storage
7. Updates job status
8. Sends ACK to RabbitMQ

If a worker crashes before acknowledging the message, RabbitMQ automatically requeues the job.

Concurrency and Idempotency

In a distributed worker environment, the same message may be delivered more than once.

To prevent duplicate processing, the worker implements atomic job claiming.

Example strategy:

findOneAndUpdate(
  { image_id, status: "pending" },
  { status: "processing" }
)

Only one worker can successfully claim a job.

Other workers skip processing if the job has already been claimed.

This ensures idempotent processing across parallel consumers.

Fault Tolerance

The worker includes several reliability mechanisms.

Message Acknowledgement

Messages are acknowledged only after successful processing.

If the worker crashes:

no ACK sent → RabbitMQ requeues message

Another worker can continue processing.

Retry Handling

Transient failures are retried automatically.

Retry strategy:

maxRetries = 3

Retry delays increase exponentially to prevent retry storms.

Dead Letter Queue (DLQ)

Jobs that exceed retry limits are moved to a Dead Letter Queue.

This prevents failing jobs from blocking healthy workloads.

Load Handling

Workers are stateless and can be scaled horizontally.

Example scaling:

1 worker → ~2 images/sec
5 workers → ~10 images/sec
10 workers → ~20 images/sec

Additional workers can be spawned to handle burst traffic.

Tech Stack

Node.js
RabbitMQ
Sharp (image processing)
Docker

Running the Worker

Start worker service:

docker-compose up worker

The worker will automatically connect to RabbitMQ and begin consuming jobs.