import "dotenv/config";
import AWS from "aws-sdk";
import fs from "fs";

const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "ap-south-1",
});

export const uploadFile = async (
      fileName: string,
      localFilePath: string
) => {
      const fileContent = fs.readFileSync(localFilePath);

      const response = await s3
            .upload({
                  Bucket: process.env.AWS_BUCKET_NAME!,
                  Key: fileName,
                  Body: fileContent,
            })
            .promise();

      return response;
};