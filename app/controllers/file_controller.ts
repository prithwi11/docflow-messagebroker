import sharp from "sharp";
import path from "path";
import fs from "fs"
import { pipeline } from "stream/promises";
import dotenv from "dotenv"
import { FileModel } from "../Models/file_model";
import moment from "moment"
import { JobsModel } from "../Models/jobs_model";
import { AwsHelper } from "../../helper/s3_helper";
import { AppConfig, configs } from "../../config/app.config";

dotenv.config()


export class FileController {
    private _filesModel: any = new FileModel();
    private _jobsModel : any = new JobsModel();
    private _awsHelper = new AwsHelper();
    private _config: AppConfig;
    constructor(appConfig: AppConfig = configs) {
        this._config = appConfig
    }

    resizeImage = async(event: any) => {
        try {
            const startTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            const image_id: string = event.image_id;
            const worker_id: number = process.pid;
            console.log("Worker is going to starttttttttttttttttttttttttt", image_id)
            if (image_id) {
                console.log(`[Worker ${worker_id}] Received message for image_id ${image_id}`);
                //It will create a race condition
                /* let jobs_insert : any = {
                    'jobs_id' : `jobs_${image_id}_${worker_id}`,
                    'entity_id' : image_id,
                    'entity_type' : 'image',
                    'job_type' : 'resize',
                    'status' : 'processing',
                    'worker_id' : worker_id,
                    'attempted_number' : 1,
                    "started_at" : moment().format("YYYY-MM-DD HH:mm:ss")
                };
                await this._jobsModel.addNewRecord(jobs_insert); */
                const claimJob: any = await this._jobsModel.claimImageForProcessing(image_id, worker_id);
                if (!claimJob) {
                    console.log(`[Worker ${worker_id}] Job already claimed for ${image_id}`)
                    return;
                }
                let image_details: any = await this._filesModel.findByAny({image_id: image_id}, {image_name: 1, status: 1});
                if (image_details) {
                    console.log(`[Worker ${worker_id}] Current status: ${image_details.status}`);
                    if (image_details.status == "uploaded") {

                        /* //For race condition
                        console.log(`[Worker ${worker_id}] waiting before resize`)
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        console.log(`[Worker ${worker_id}] starting to resize image`)

                        await this._filesModel.trackProcessingAttempt(image_id, worker_id) */

                        const image_name = image_details.image_name;
                        console.log("this._config.imagePath", this._config)
                        const localInputPath = path.resolve(this._config.imagePath, image_name);
                        console.log("locslInputPath", localInputPath);
                        // 2. Set up source and destination paths
                        const outputDir = path.dirname(localInputPath);
                        const outputFileName = `${path.parse(image_name).name}.webp`;
                        const outputPath = path.join(outputDir, outputFileName);
                        
                        const bucket_name = this._config.s3Bucket
                        console.log("starting downloading from s3", bucket_name, image_name, localInputPath)
                        const downloadFile = await this._awsHelper.downloadFromS3({bucket: bucket_name as string, key: image_name, destinationPath: localInputPath});
                        console.log("downloaded from s3", downloadFile)
                        
                        const transformer = sharp()
                            .resize(800, 600)
                            .webp({ quality: 80 })
                            .on('info', (info) => console.log("Image processed:"));
                        console.log("Image sharped")
                        // 3. Create file streams
                        const input = fs.createReadStream(localInputPath);
                        console.log("Image streamed 1")
                        const output = fs.createWriteStream(outputPath);
                        console.log("Image Streamed 2")
                        // 4. Execute the pipeline
                        await pipeline(input, transformer, output);
                        console.log("Image pipelined")
                        const update_obj: any = {status: 'resized', updated_timestamp: moment().format("YYYY-MM-DD HH:mm:ss")};
                        console.log("update_ob,jjjjjjjjjjjjjjjj", update_obj, image_id)
                        const update = await this._filesModel.updateAnyRecord({image_id: image_id}, update_obj);
                        const endTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
                        const processingTime = moment(endTime).diff(moment(startTime), 'milliseconds');

                        await this._jobsModel.updateAnyRecord({entity_id: image_id}, {
                            $set : {
                                'status' : 'completed',
                                'completed_at' : moment().format("YYYY-MM-DD HH:mm:ss"),
                                'processing_time' : processingTime,
                            }
                        });
                        const s3Response: any = await this._awsHelper.s3Upload( localInputPath, image_name, bucket_name);
                        console.log("File Resized successfully")
                    }
                }
                else {
                    await this._jobsModel.updateAnyRecord({'entity_id' : image_id}, {
                        $set : {
                            'status' : 'failed',
                            'completed_at' : moment().format("YYYY-MM-DD HH:mm:ss")
                        }
                    })
                    console.log("No Image found");
                }
            }
            else {
                console.log("No Image ID found");
            }
        }
        catch(error: any) {
            console.log("Error in file processing", error.stack);
            throw error;
        }
    }
}