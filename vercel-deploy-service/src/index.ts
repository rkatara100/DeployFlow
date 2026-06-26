import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";

const subscriber = createClient({
      RESP: 2
});
subscriber.connect();

const publisher = createClient({
      RESP: 2
});
publisher.connect();

async function main() {
      while (true) {
            try {
                  const response = await subscriber.brPop(
                        "build-queue",
                        0
                  );

                  const id = response && response.element;
                  if (!id) {
                        throw new Error("id is required");
                  }

                  console.log("response:", response);
                  await downloadS3Folder(`output/${id}`)
                  await buildProject(id);
                  await copyFinalDist(id);

                  await publisher.hSet("status", id, "deployed");
                  console.log("downloaded");
            } catch (err) {
                  console.error("Error:", err);
            }
      }
}

main();