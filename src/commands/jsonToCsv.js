import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { resolvePath } from "../utils/pathResolver.js";

export const jsonToCsv = async (currentDir, args) => {
  if (!args.input || !args.output) {
    console.log("Invalid input");
    return;
  }

  const inputPath = resolvePath(currentDir, args.input);
  const outputPath = resolvePath(currentDir, args.output);

  const chunks = [];
  const readStream = createReadStream(inputPath);
  for await (const chunk of readStream) chunks.push(chunk);

  let parsedJson;
  try {
    parsedJson = JSON.parse(Buffer.concat(chunks).toString());
  } catch (_) {
    throw new Error("Operation failed");
  }

  if (!Array.isArray(parsedJson) || parsedJson.length === 0)
    throw new Error("Operation failed");

  const headers = Object.keys(parsedJson[0]);
  const lines = [
    headers.join(","),
    ...parsedJson.map((row) =>
      headers.map((header) => String(row[header] ?? "")).join(","),
    ),
  ];

  await pipeline(
    Readable.from(lines.join("\n")),
    createWriteStream(outputPath),
  );

  console.log(`Converted to CSV: ${outputPath}`);
};
