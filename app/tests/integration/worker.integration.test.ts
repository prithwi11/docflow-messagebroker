import { TestDatabase } from "../helper/test.database";
import { TestS3Config } from "../helper/test.s3";
import { TestSQSHelper } from "../helper/test.queue";
import { TestFixtures } from "../helper/test.fixtures";
import { MongoModel } from "../helper/test.database";
import { FileModel } from "../../Models/file_model";
import { JobsModel } from "../../Models/jobs_model";
import path from "path";
import { randomUUID } from "crypto";
import moment from "moment";
import { spawn } from "child_process";
import { spawnWorker } from "../helper/test.worker";
import dotenv from "dotenv"
dotenv.config()
import fs from "fs"


describe("Test 1: End-to-End Image Processing", () => {
    let test_db = new TestDatabase();
    let filesModel: any;
    let jobsModel: any;
    let workerProcess: any;

    beforeAll(async() => {
        const test_s3_setup = new TestS3Config();
        const create_new_bucket: any = await test_s3_setup.createTestBucket();
        // const connection = await test_db.createStandaloneConnection();
        filesModel = new FileModel();
        jobsModel = new JobsModel();

        // Start worker process
        workerProcess = await spawnWorker();
    });

    afterAll(async() => {
        workerProcess.kill('SIGTERM')
        await test_db.closeConnection();
    })

    test("Should process image from queue to completion", async() => {
        const startTime = Date.now();
        // Create Test Image
        const test_fixtures = new TestFixtures();
        const test_image = await test_fixtures.createTestImage();
        expect(test_image).toBeDefined()

        if (test_image) {
            // Upload the image to S3 Bucket
            let local_file_path = path.join(__dirname, '..', 'uploads', test_image);
            const test_s3_setup = new TestS3Config();
            console.log("Resolved path:", local_file_path);
            console.log("Exists:", fs.existsSync(local_file_path));
            const upload_file_to_s3: any = await test_s3_setup.uploadFileToS3(local_file_path, test_image);
            console.log("upload_file_to_s3", upload_file_to_s3);
            expect(upload_file_to_s3.error).toBe(false);

            if (upload_file_to_s3 && upload_file_to_s3.error == false) {
                // Update the database
                const test_db_obj: any = {
                    image_id: randomUUID(),
                    image_name: test_image,
                    status: 'uploaded',
                    added_timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
                }
                const insert_to_test_file_obj: any = await filesModel.addNewRecord(test_db_obj);
                expect(insert_to_test_file_obj).toBeDefined()

                // Send the file to rabbitmq
                const test_sqs_helper = new TestSQSHelper();
                const test_process_image = test_sqs_helper.pushMessageToQueue({image_name: test_image, startTime: startTime, image_id: insert_to_test_file_obj.image_id});

                // Need to check worker
                //Wait for job status
                const waitForJobStatus = async(image_id: string, expectedStatus: string, timeOutms: number = 5000) => {
                    const startTime = Date.now();
                
                    while (Date.now() - startTime < timeOutms) {
                        const file_details = await filesModel.findByAny({image_id: image_id});

                        if (file_details && file_details.status == expectedStatus) {
                            return true;
                        }
                        await sleep(200) //poll every 200ms
                    }
                }
                
                const sleep = (ms: number): Promise<void> => {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }


                const file_status = await waitForJobStatus(insert_to_test_file_obj.image_id, "resized", 30000);
                // const file_status = await filesModel.findByAny({image_id: insert_to_test_file_obj.image_id});
                console.log("file_status", file_status)
                expect(file_status).toBe(true);
            }
        }
    }, 30000)
});
