'use strict'
import { MongoModel } from "../../model"

export class FileModel extends MongoModel {
    constructor() {
        super(
            'file_details',
            {
                image_id: {type: String, required: true},
                image_name: {type: String, required:  true},
                image_resized_name: {type: String, required: false},
                status: {type: String, required: true},
                added_timestamp: {type: Date, required: true},
                updated_timestamp: {type: Date, required: false}
            }
        )
    }
}