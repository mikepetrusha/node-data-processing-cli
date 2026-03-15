import { createReadStream, createWriteStream } from "node:fs";
import { resolvePath } from "../utils/pathResolver.js";
import { open } from "node:fs/promises";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";

export const decrypt = async (currentDir, args) => {
  if (!args.input || !args.output || !args.password) {
    console.log("Invalid input");
    return;
  }

  const inputPath = resolvePath(currentDir, args.input);
  const outputPath = resolvePath(currentDir, args.output);

  const fd = await open(inputPath, "r");
  const { size } = await fd.stat();

  const header = Buffer.alloc(28);
  await fd.read(header, 0, 28, 0);
  const salt = header.subarray(0, 16);
  const iv = header.subarray(16, 28);

  const authTag = Buffer.alloc(16);
  await fd.read(authTag, 0, 16, size - 16);
  await fd.close();

  const key = crypto.scryptSync(args.password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  await pipeline(
    createReadStream(inputPath, { start: 28, end: size - 17 }),
    decipher,
    createWriteStream(outputPath),
  );

  console.log(`Decrypted: ${outputPath}`);
};
