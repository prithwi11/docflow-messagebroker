import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import * as fs from "fs"
import { AppConfig, configs } from "../config/app.config";

export class AwsHelper {
  private client: S3Client;
  private _config: AppConfig;

  constructor(appConfig: AppConfig = configs) {
    this._config = appConfig;

    this.client = new S3Client({
      region: this._config.awsRegion!,
      credentials: {
            accessKeyId: this._config.awsAccessKey as string,
            secretAccessKey: this._config.awsSecretAccessKey as string
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
        Bucket: this._config.s3Bucket!,
        Key: key,
      })
    );

    return { success: true, message: "File deleted from S3" };
  }

  public s3Upload = async(localFilePath: string, filename: string, bucket_name: string) => {
      let that = this;
      return new Promise(function (resolve, reject) {
            const command = new PutObjectCommand({
              Bucket: bucket_name,
              Key: `${that._config.s3ResizeFolder}/${filename}`,
              Body: fs.readFileSync(localFilePath),
            });
            that.client.send(command, (err: object, data: any) => {
              if (err) return resolve({error: true, message: "Unable to upload file in S3", errorStack: err});
              else {
                fs.unlink(localFilePath, (err => {
                  if (err) console.error(err)
                }));
                return resolve({error: false, message: "File uploaded to S3 successfully",});
              }
            });
      })
  }
}
