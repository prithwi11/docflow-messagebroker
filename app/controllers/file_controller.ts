import sharp from "sharp";
import path from "path";
import fs from "fs"
import { pipeline } from "stream/promises";
import dotenv from "dotenv"

dotenv.config()

export class FileController {
    constructor() {}
    resizeImage = async(event: any) => {
        try {
            const image_name = event.image_name;
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
            console.log("File Resized successfully")
        }
        catch(error: any) {
            console.log("Error in file processing", error.stack);
        }
    }
}