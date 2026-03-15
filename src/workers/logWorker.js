import { createReadStream } from "node:fs";
import { workerData, parentPort } from "node:worker_threads";

const { filePath, start, end } = workerData;

const stats = {
  total: 0,
  responseTimeSum: 0,
  levels: {},
  status: {},
  paths: {},
};

let leftover = "";

const stream = createReadStream(filePath, { start, end });

stream.on("data", (chunk) => {
  const text = leftover + chunk.toString();
  const lines = text.split("\n");
  leftover = lines.pop();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(" ");
    if (parts.length < 7) continue;

    const [, level, , statusCode, responseTimeMs, , reqPath] = parts;

    stats.total++;
    stats.levels[level] = (stats.levels[level] || 0) + 1;
    stats.responseTimeSum += parseFloat(responseTimeMs) || 0;
    stats.paths[reqPath] = (stats.paths[reqPath] || 0) + 1;

    const code = parseInt(statusCode, 10);
    const bucket = `${Math.floor(code / 100)}xx`;
    stats.status[bucket] = (stats.status[bucket] || 0) + 1;
  }
});

stream.on("end", () => {
  // Process any remaining leftover
  if (leftover.trim()) {
    const parts = leftover.trim().split(" ");
    if (parts.length >= 7) {
      const [, level, , statusCode, responseTimeMs, , reqPath] = parts;
      stats.total++;
      stats.levels[level] = (stats.levels[level] || 0) + 1;
      stats.responseTimeSum += parseFloat(responseTimeMs) || 0;
      stats.paths[reqPath] = (stats.paths[reqPath] || 0) + 1;
      const code = parseInt(statusCode, 10);
      const bucket = `${Math.floor(code / 100)}xx`;
      stats.status[bucket] = (stats.status[bucket] || 0) + 1;
    }
  }
  parentPort.postMessage(stats);
});

stream.on("error", () => parentPort.postMessage(stats));
