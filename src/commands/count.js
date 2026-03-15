import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { resolvePath } from "../utils/pathResolver.js";

export const count = async (currentDir, args) => {
  if (!args.input) {
    console.log("Invalid input");
    return;
  }

  const inputPath = resolvePath(currentDir, args.input);

  let lines = 0,
    words = 0,
    characters = 0;

  const transform = new Transform({
    transform(chunk, _, callback) {
      const text = chunk.toString();
      characters += text.length;
      lines += (text.match(/\n/g) || []).length;
      words += (text.match(/\S+/g) || []).length;
      callback();
    },
  });

  transform.resume();

  await pipeline(createReadStream(inputPath), transform);

  console.log(`Lines: ${lines}`);
  console.log(`Words: ${words}`);
  console.log(`Characters: ${characters}`);
};
