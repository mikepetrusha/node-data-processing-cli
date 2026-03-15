import { createReadStream, createWriteStream } from "node:fs";
import { resolvePath } from "../utils/pathResolver.js";
import { appendFile } from "node:fs/promises";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";

export const encrypt = async (currentDir, args) => {
  if (!args.input || !args.output || !args.password) {
    console.log("Invalid input");
    return;
  }

  const inputPath = resolvePath(currentDir, args.input);
  const outputPath = resolvePath(currentDir, args.output);

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(args.password, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const outStream = createWriteStream(outputPath);
  outStream.write(salt);
  outStream.write(iv);

  await pipeline(createReadStream(inputPath), cipher, outStream);

  const authTag = cipher.getAuthTag();
  await appendFile(outputPath, authTag);

  console.log(`Encrypted: ${outputPath}`);
};
