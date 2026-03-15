import fs, { readdir } from "node:fs/promises";
import path from "node:path";

export const handleUp = async (currentDir) => {
  const newPath = path.resolve(currentDir, "..");
  if (newPath === currentDir) return currentDir;
  return newPath;
};

export const handleCd = async (currentDir, targetPath) => {
  if (!targetPath) {
    console.log("Invalid input");
    return currentDir;
  }

  const resolvedPath = path.resolve(currentDir, targetPath);

  try {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isDirectory()) {
      console.log("Operation failed");
      return currentDir;
    }
    return resolvedPath;
  } catch (_) {
    console.log("Operation failed");
    return currentDir;
  }
};

export const handleLs = async (currentDir) => {
  const data = await readdir(currentDir, { withFileTypes: true });

  const folders = data
    .filter((entry) => entry.isDirectory)
    .map((dir) => dir.name)
    .sort();

  const files = data
    .filter((entry) => entry.isFile)
    .map((file) => file.name)
    .sort();

  const all = [
    ...folders.map((dir) => ({ name: dir, type: "folder" })),
    ...files.map((file) => ({ name: file, type: "file" })),
  ];

  if (all.length === 0) {
    console.log("(empty folder)");
    return;
  }

  const maxLengthOfName = Math.max(...all.map((entry) => entry.name.length));

  for (const entry of all) {
    console.log(`${entry.name.padEnd(maxLengthOfName + 2)}[${entry.type}]`);
  }
};
