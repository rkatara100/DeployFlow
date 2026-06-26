import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { generate } from "./utils";
import simpleGit from "simple-git";
import path from "path";
import { getAllFiles } from "./files";
import { uploadFile } from "./aws";

import { createClient } from "redis";
const publisher = createClient({
      RESP: 2
});
publisher.connect();

const subscriber = createClient({
      RESP: 2
});
subscriber.connect();

const app = express();
app.use(cors());
app.use(express.json());


app.post("/deploy", async (req, res) => {
      const repoUrl = req.body.repoUrl;

      const id = generate();
      await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

      const files = getAllFiles(path.join(__dirname, `output/${id}`));

      const keys = files.map(file =>
            file.slice(__dirname.length + 1).split(path.sep).join("/")
      );

      await Promise.all(
            files.map((file, i) => {
                  console.log("uploading", keys[i]);
                  return uploadFile(keys[i], file);
            })
      );

      await publisher.lPush("build-queue", id);
      await publisher.hSet("status", id, "uploaded");

      res.json({ id: id });
})

app.get("/status", async (req, res) => {
      const id = req.query.id;
      console.log(">>>>id", id);

      const response = await subscriber.hGet("status", id as string);
      console.log(">>>res", response);
      res.json({
            status: response
      })
})
app.listen(3000, () => {
      console.log("Server running on port 3000");
});