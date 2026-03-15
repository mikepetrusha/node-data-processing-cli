import { createReadStream } from "node:fs";
import { resolvePath } from "../utils/pathResolver.js";
import { writeFile } from "node:fs/promises";
import crypto from "node:crypto";

const SUPPORTED = ["sha256", "md5", "sha512"];

export const hash = async (currentDir, args) => {
  if (!args.input) {
    console.log("Invalid input");
    return;
  }

  const algorithm = args.algorithm || "sha256";
  if (!SUPPORTED.includes(algorithm)) throw new Error("Operation failed");

  const inputPath = resolvePath(currentDir, args.input);
  const hash = crypto.createHash(algorithm);
  const readStream = createReadStream(inputPath);

  for await (const chunk of readStream) {
    hash.update(chunk);
  }

  const digest = hash.digest("hex");
  console.log(`${algorithm}: ${digest}`);

  if (args.save) {
    const savePath = inputPath + "." + algorithm;
    await writeFile(savePath, digest);
    console.log(`Hash saved to: ${savePath}`);
  }
};
