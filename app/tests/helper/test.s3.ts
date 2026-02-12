import { S3helperClient, S3helperClientresponse } from "../../../common_interface";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs, { createWriteStream } from "fs"
import { pipeline } from "stream/promises";
import dotenv from "dotenv"
dotenv.config()

export class TestS3Config {
    private client: S3helperClient;

    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_DEFAULT_REGION!,
            credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY as string,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
            }
        });
    }

    public uploadFileToS3 = async(localFilePath: string, filename: string) => {
        let that = this;
        return new Promise(function (resolve, reject) {
            const command = new PutObjectCommand({
                Bucket: process.env.S3_TEST_BUCKET,
                Key: filename,
                Body: fs.readFileSync(localFilePath)
            });
            that.client.send(command, (err: object, data: S3helperClientresponse) => {
                if (err) return resolve({error: true, message: "Unable to upload file in s3", errorStack: err});
                else {
                    fs.unlink(localFilePath, (err => {
                        if (err) console.error(err)
                    }));
                return resolve({error: false, message: "File uploaded to S3"})
                }
            })
        })
    }

    public deleteFileFromS3 = async(filepath: string) => {
        let that = this;
        return new Promise(function (resolve, reject) {
            const command = new DeleteObjectCommand({
                Bucket: process.env.S3_TEST_BUCKET,
                Key: filepath
            });

            that.client.send(command, (err: object, data: S3helperClientresponse) => {
                if (err) {
                    return resolve({error: true, message: "Unable to upload file in S3", errorStack: err});
                }
                else {
                    return resolve({error:false, message:'File deleted successfully from S3.',data:data});
                }
            })
        })
    }

    public async downloadFromS3(params: { bucket: string; key: string; destinationPath: string }) {
        const command = new GetObjectCommand({
            Bucket: params.bucket,
            Key: params.key,
        });

        const response = await this.client.send(command, (err: object) => {
            if (err) {
                throw new Error("Error fetching object from S3: " + err);
            }
        });

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

    public async cleanTestBucket() {
        let isTruncated: boolean = true;
        let continuationToken;

        while (isTruncated) {
            const list_params = {
                Bucket: process.env.S3_TEST_BUCKET,
                ContinuationToken: continuationToken
            }

            const { Contents, IsTruncated, NextContinuationToken } = await this.client.send(new ListObjectsV2Command(list_params), (err: object) => {
                if (err) {
                    throw new Error("Error listing objects from S3: " + err);
                }
            });

            if (!Contents || Contents.length === 0) break;
            const deleteParams = {
                Bucket: process.env.S3_TEST_BUCKET,
                Delete: {
                  Objects: Contents.map((item: any) => ({ Key: item.Key })),
                  Quiet: true,
                },
            };

            await this.client.send(new DeleteObjectsCommand(deleteParams), (err: object) => {
                if (err) {
                    throw new Error("Error deleting all objects from S3: " + err);
                }
            });
            console.log(`Deleted ${Contents.length} objects.`);

            // 4. Check if more files remain
            isTruncated = IsTruncated;
            continuationToken = NextContinuationToken;
        }
        console.log("Bucket is now empty.");
    }

    public async verifyS3ObjectExists(file_name: string) {
        const command = new HeadObjectCommand({
            Bucket: process.env.S3_TEST_BUCKET,
            Key: `resized/${file_name}`
        });

        await this.client.send(command, (err: any) => {
            if (err) {
                if (err.name = "NotFound" || err.$metadata?.httpStatusCode === 404) {
                    return false
                }
                throw new Error(err);
            }
        });
        return true;
    }
}