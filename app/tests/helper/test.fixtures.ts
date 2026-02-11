import fs from "fs"
import { createCanvas } from "canvas";
import { randomUUID } from "crypto";
import path from "path";

export class TestFixtures {
    createTestImage = async() => {
        try {
            const width = 400;
            const height = 200;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const uploadDir = path.join(__dirname, '..', 'uploads')

            // Fill the background with a color
            ctx.fillStyle = '#ff0000'; // Red background
            ctx.fillRect(0, 0, width, height);

            // Add some text
            ctx.fillStyle = '#ffffff'; // White text color
            ctx.font = '30px Impact';
            ctx.textAlign = 'center';
            ctx.fillText('Hello World!', width / 2, height / 2 + 10);

            // Save the image to a file
            const buffer = canvas.toBuffer('image/png');
            const file_name: string = "sample_canvase_image.png";
            const filePath = path.join(uploadDir, file_name);

            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            fs.writeFileSync(filePath, buffer);

            console.log(`Image ${file_name} generated successfully!`);
            return file_name;
        }
        catch (error: any) {
            console.error("Error in Creating Image", error.message);
        }
    }

    createTestJobData = async(file_name: string, start_time: Date) => {
        try {
            const test_queue_data: any = {
                image_name: file_name,
                start_time
            }
        }
        catch (error: any) {
            console.error("Error in creating test job data", error.message);
        }
    }
}