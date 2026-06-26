import dotenv from "dotenv";
dotenv.config();
import * as AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "ap-south-1",
});

// output/asdasd
export async function downloadS3Folder(prefix: string) {
      const allFiles = await s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Prefix: prefix
      }).promise();
      console.log("found", allFiles.Contents?.length, "objects for prefix", prefix);

      // 
      const allPromises = allFiles.Contents?.map(({ Key }) => {
            return new Promise<void>((resolve, reject) => {
                  if (!Key) return resolve();

                  const finalOutputPath = path.join(__dirname, Key);
                  const dirName = path.dirname(finalOutputPath);
                  if (!fs.existsSync(dirName)) {
                        fs.mkdirSync(dirName, { recursive: true });
                  }

                  const outputFile = fs.createWriteStream(finalOutputPath);
                  s3.getObject({ Bucket: process.env.AWS_BUCKET_NAME!, Key })
                        .createReadStream()
                        .on("error", reject)
                        .pipe(outputFile)
                        .on("finish", () => resolve())
                        .on("error", reject);
            });
      }) || [];
      console.log("awaiting");

      await Promise.all(allPromises?.filter(x => x !== undefined));
}


export function copyFinalDist(id: string) {
      const folderPath = path.join(__dirname, `output/${id}/dist`);
      const allFiles = getAllFiles(folderPath);
      allFiles.forEach(file => {
            uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
      })
}

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
      console.log("response", response);
      return response;
};

export const getAllFiles = (folderPath: string) => {
      let response: string[] = [];

      const allFilesAndFolders = fs.readdirSync(folderPath);

      allFilesAndFolders.forEach(file => {
            const fullFilePath = path.join(folderPath, file);

            if (fs.statSync(fullFilePath).isDirectory()) {
                  response = response.concat(getAllFiles(fullFilePath));
            } else {
                  response.push(fullFilePath);
            }
      });
      return response;
}