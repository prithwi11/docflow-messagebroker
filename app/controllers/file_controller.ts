import sharp from "sharp";
import path from "path";
import fs from "fs"
import { pipeline } from "stream/promises";
import dotenv from "dotenv"
import { FileModel } from "../Models/file_model";
import moment from "moment"

dotenv.config()

export class FileController {
    constructor() {}
    private _filesModel: any = new FileModel();
    resizeImage = async(event: any) => {
        try {
            const image_id: string = event.image_id;
            if (image_id) {
                let image_details: any = await this._filesModel.findByAny({image_id: image_id}, {image_name: 1, status: 1});
                if (image_details) {
                    if (image_details.status == "uploaded") {
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
                        const update = await this._filesModel.updateAnyRecord({image_id: image_id}, update_obj)
                        console.log("File Resized successfully")
                    }
                }
                else {
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