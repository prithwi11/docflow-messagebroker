import { MongoModel } from "../../model";
import moment from "moment"

export class JobsModel extends MongoModel {
    constructor() {
        super(
            'jobs',
            {
                jobs_id: {type: String, required: true},
                entity_id: {type: String, required: true},
                entity_type: {type: String, required: true},
                status: {type: String, required: false},
                job_type: {type: String, required: false},
                worker_id: {type: String, required: true},
                attempted_number: {type: Number, required: true},
                started_at: {type: Date, required: false},
                completed_at: {type: Date, required: false},
                processing_time: {type: String, required: false}
            },
        )
    }

    async claimImageForProcessing(image_id: number, worker_id: number) {
        try {
            const jobs_insert = {
                'job_id' : `job_${image_id}_${worker_id}`,
                'entity_id' : image_id,
                'entity_type' : 'image',
                'job_type' : 'resize',
                'status' : 'processing',
                'worker_id' : worker_id,
                'attempted_number' : 1,
                'started_at' : moment().format("YYYY-MM-DD HH:mm:ss")
            }

            const result: any = await this.findOneAndUpdate(
                {
                    entity_id: image_id,
                    status: { $in: ['processing', 'pending'] }  
                },
                {
                    $setOnInsert: jobs_insert
                },
                {
                    upsert: true,
                    returnDocument: 'after',
                    includeResultMetadata: true
                }
            );

            if (result.value) {
                console.log(`Worker ${worker_id} created new job`);
                return result.value;  // We created it, proceed!
            } else {
                console.log(`Worker ${worker_id} found existing job`);
                return null;  // Job already exists, skip!
            }
        }
        catch (error: any) {
            console.log(`Error in claimImageForProcessing: `, error.message);
            return null;
        }
    }
}