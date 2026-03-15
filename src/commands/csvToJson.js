import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { resolvePath } from "../utils/pathResolver.js";

export const csvToJson = async (currentDir, args) => {
  if (!args.input || !args.output) throw new Error("Invalid input");

  const inputPath = resolvePath(currentDir, args.input);
  const outputPath = resolvePath(currentDir, args.output);

  let headers = null;
  let isFirst = true;
  let buffer = "";

  const transform = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (!headers) {
          headers = trimmed.split(",");
          this.push("[");
        } else {
          const values = trimmed.split(",");
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] ?? "";
          });
          const prefix = isFirst ? "\n  " : ",\n  ";
          this.push(prefix + JSON.stringify(obj));
          isFirst = false;
        }
      }
      callback();
    },
    flush(callback) {
      if (buffer && headers) {
        const values = buffer.split(",");
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] ?? "";
        });
        const prefix = isFirst ? "\n  " : ",\n  ";
        this.push(prefix + JSON.stringify(obj));
      }

      this.push("\n]");
      callback();
    },
  });

  await pipeline(
    createReadStream(inputPath),
    transform,
    createWriteStream(outputPath),
  );

  console.log(`Converted to JSON: ${outputPath}`);
};
