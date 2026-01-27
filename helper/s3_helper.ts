import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

export class AwsHelper {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION!,
      credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
      }
    });
  }

  /**
   * Download a file from S3 to local disk
   */
  public async downloadFromS3(params: {
    bucket: string;
    key: string;
    destinationPath: string;
  }) {
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error("S3 object has no body");
    }

    await pipeline(
      response.Body as NodeJS.ReadableStream,
      createWriteStream(params.destinationPath)
    );

    return {
      success: true,
      message: "File downloaded successfully",
      path: params.destinationPath,
    };
  }

  /**
   * Delete file from S3
   */
  public async deleteFileFromS3(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
    );

    return { success: true, message: "File deleted from S3" };
  }
}
