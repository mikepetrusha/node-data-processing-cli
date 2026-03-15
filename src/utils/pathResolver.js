import path from "node:path";

export const resolvePath = (currentDir, filePath) => {
  return path.resolve(currentDir, filePath);
};
