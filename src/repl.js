import readline from "node:readline";
import { handleCd, handleLs, handleUp } from "./navigation.js";
import { csvToJson } from "./commands/csvToJson.js";
import { parseArgs } from "./utils/argParser.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { count } from "./commands/count.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";

export const startRepl = (initDir) => {
  let currentDir = initDir;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    const [command, ...rest] = trimmed.split(/\s+/);
    const args = parseArgs(rest);

    try {
      switch (command) {
        case "up": {
          currentDir = await handleUp(currentDir);
        }
        case "cd": {
          currentDir = await handleCd(currentDir, rest[0]);
          break;
        }
        case "ls": {
          await handleLs(currentDir);
          break;
        }
        case "csv-to-json": {
          await csvToJson(currentDir, args);
          break;
        }
        case "json-to-csv": {
          await jsonToCsv(currentDir, args);
          break;
        }
        case "count": {
          await count(currentDir, args);
          break;
        }
        case "hash": {
          await hash(currentDir, args);
          break;
        }
        case "hash-compare": {
          await hashCompare(currentDir, args);
          break;
        }
        case ".exit": {
          rl.close();
          return;
        }

        default: {
          console.log("Invalid input");
        }
      }
    } catch (_) {
      console.log("Operation failed");
    }

    console.log(`You are currently in ${currentDir}\n`);
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Thank you for using Data Processing CLI!");
    process.exit(0);
  });
};
