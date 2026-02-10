import fs from "fs"
import { createCanvas } from "canvas";

export class TestFixtures {
    createTestImage = async() => {
        const width = 400;
        const height = 200;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

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
        fs.writeFileSync('./sample_canvas_image.png', buffer);

        console.log('Image "sample_canvas_image.png" generated successfully!');
    }
}