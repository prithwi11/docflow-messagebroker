import sharp from "sharp";
import path from "path";
import fs from "fs"
import { pipeline } from "stream/promises";
import dotenv from "dotenv"
import { FileModel } from "../Models/file_model";
import moment from "moment"
import { JobsModel } from "../Models/jobs_model";

dotenv.config()


export class FileController {
    constructor() {}
    private _filesModel: any = new FileModel();
    private _jobsModel : any = new JobsModel();

    resizeImage = async(event: any) => {
        try {
            const image_id: string = event.image_id;
            const worker_id: number = process.pid;
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
                console.log("claimJob", claimJob)
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
                        const image_path = path.resolve(process.env.IMAGE_PATH as string, image_name);
                        const transformer = sharp()
                            .resize(800, 600)
                            .webp({ quality: 80 })
                            .on('info', (info) => console.log("Image processed:", info));
                    
                        // 2. Set up source and destination paths
                        const outputDir = path.dirname(image_path);
                        const outputFileName = `${path.parse(image_name).name}.webp`;
                        const outputPath = path.join(outputDir, outputFileName);
                    
                        // 3. Create file streams
                        const input = fs.createReadStream(image_path);
                        const output = fs.createWriteStream(outputPath);
                    
                        // 4. Execute the pipeline
                        await pipeline(input, transformer, output);
                        const update_obj: any = {status: 'resized', updated_timestamp: moment().format("YYYY-MM-DD HH:mm:ss")};
                        const update = await this._filesModel.updateAnyRecord({image_id: image_id}, update_obj);
                        await this._jobsModel.updateAnyRecord({entity_id: image_id}, {
                            $set : {
                                'status' : 'completed',
                                'completed_at' : moment().format("YYYY-MM-DD HH:mm:ss")
                            }
                        })
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
        }
    }
}