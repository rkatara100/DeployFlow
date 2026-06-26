import dotenv from "dotenv";
dotenv.config();
import express from "express";
import AWS, { S3 } from "aws-sdk";

const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "ap-south-1",
});

const app = express();

app.get("/*splat", async (req, res) => {
      const host = req.host;
      const id = host.split(".")[0];
      const filePath = req.path;

      const contents = await s3.getObject({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: `/dist/${id}/${filePath}`
      }).promise();

      const type = filePath.endsWith("html")
            ? "text/html" : filePath.endsWith("css")
                  ? "text/css" : "application/javascript"
      res.set("Content-Type", type);
      res.send(contents.Body);
})
app.listen(3001)