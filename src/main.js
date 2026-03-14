import os from "node:os";
import { startRepl } from "./repl.js";

const main = () => {
  const currentDir = os.homedir();

  console.log("Welcome to Data Processing CLI!");
  console.log(`You are currently in ${currentDir}\n`);

  startRepl(currentDir);
};

main();
