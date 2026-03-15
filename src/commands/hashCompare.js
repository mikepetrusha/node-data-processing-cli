import { createReadStream } from "node:fs";
import { resolvePath } from "../utils/pathResolver.js";
import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

const SUPPORTED = ["sha256", "md5", "sha512"];

export const hashCompare = async (currentDir, args) => {
  if (!args.input || !args.hash) {
    console.log("Invalid input");
    return;
  }

  const algorithm = args.algorithm || "sha256";
  if (!SUPPORTED.includes(algorithm)) throw new Error("Operation failed");

  const inputPath = resolvePath(currentDir, args.input);
  const hashFilePath = resolvePath(currentDir, args.hash);

  const hash = crypto.createHash(algorithm);
  const readStream = createReadStream(inputPath);

  for await (const chunk of readStream) {
    hash.update(chunk);
  }

  const digest = hash.digest("hex");
  const expected = await readFile(hashFilePath, "utf8");

  console.log(
    digest.toLowerCase() === expected.trim().toLowerCase() ? "OK" : "MISMATCH",
  );
};
