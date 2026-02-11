'use strict'
import { MongoModel } from "../../model"

export class FileModel extends MongoModel {

    constructor(test_connection?: any) {
        super(
            'file_details',
            {
                image_id: {type: String, required: true},
                image_name: {type: String, required:  true},
                image_resized_name: {type: String, required: false},
                status: {type: String, required: true},
                added_timestamp: {type: Date, required: true},
                updated_timestamp: {type: Date, required: false},
            },
            {},
            test_connection
        )
    }

    async trackProcessingAttempt(image_id: string, worker_id: number) {
        return await this.updateAnyRecord({image_id: image_id}, {
            $set: {
                'status' : 'progressing',
                worker_id: worker_id,
            },
            $inc: { processing_count: 1 },
            $push: { processed_by_workers: worker_id }
        })
    }

    async maybeFail(probablity = 0.1) {
        if (Math.random() < probablity) {
            throw new Error("Simulated transient DB Failure");
        }
    }

    async claimImageForProcessing(image_id: string, worker_id: number) {}
}