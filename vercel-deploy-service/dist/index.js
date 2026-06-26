"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redis_1 = require("redis");
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const subscriber = (0, redis_1.createClient)({
    RESP: 2
});
subscriber.connect();
const publisher = (0, redis_1.createClient)({
    RESP: 2
});
publisher.connect();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                const response = yield subscriber.brPop("build-queue", 0);
                const id = response && response.element;
                if (!id) {
                    throw new Error("id is required");
                }
                console.log("response:", response);
                yield (0, aws_1.downloadS3Folder)(`output/${id}`);
                yield (0, utils_1.buildProject)(id);
                yield (0, aws_1.copyFinalDist)(id);
                yield publisher.hSet("status", id, "deployed");
                console.log("downloaded");
            }
            catch (err) {
                console.error("Error:", err);
            }
        }
    });
}
main();
