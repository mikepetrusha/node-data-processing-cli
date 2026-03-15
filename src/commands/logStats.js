import { resolvePath } from "../utils/pathResolver.js";
import { open, stat, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";

export const logStats = async (currentDir, args) => {
  if (!args.input || !args.output) {
    console.log("Invalid input");
    return;
  }

  const inputPath = resolvePath(currentDir, args.input);
  const outputPath = resolvePath(currentDir, args.output);

  const { size } = await stat(inputPath);
  const numOfWorkers = cpus().length;
  const chunkSize = Math.ceil(size / numOfWorkers);

  const ranges = [];
  let start = 0;
  const fd = await open(inputPath, "r");

  for (let i = 0; i < numOfWorkers; i++) {
    if (start >= size) break;
    let end = Math.min(start + chunkSize, size) - 1;

    if (end < size - 1) {
      const scanBuf = Buffer.alloc(256);
      let pos = end;
      while (pos < size) {
        await fd.read(scanBuf, 0, 1, pos);
        if (scanBuf[0] === 0x0a) break;
        pos++;
      }
      end = pos;
    }
    ranges.push({ start, end });
    start = end + 1;
  }

  await fd.close();

  const workerPath = path.join(
    import.meta.dirname,
    "..",
    "workers",
    "logWorker.js",
  );
  const partials = await Promise.all(
    ranges.map(
      ({ start, end }) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(workerPath, {
            workerData: { filePath: inputPath, start, end },
          });
          worker.on("message", resolve);
          worker.on("error", reject);
        }),
    ),
  );

  const merged = partials.reduce(
    (acc, p) => {
      acc.total += p.total;
      acc.responseTimeSum += p.responseTimeSum;
      for (const [k, v] of Object.entries(p.levels))
        acc.levels[k] = (acc.levels[k] || 0) + v;
      for (const [k, v] of Object.entries(p.status))
        acc.status[k] = (acc.status[k] || 0) + v;
      for (const [k, v] of Object.entries(p.paths))
        acc.paths[k] = (acc.paths[k] || 0) + v;
      return acc;
    },
    { total: 0, responseTimeSum: 0, levels: {}, status: {}, paths: {} },
  );

  const topPaths = Object.entries(merged.paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([p, count]) => ({ path: p, count }));

  const result = {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs:
      merged.total > 0
        ? parseFloat((merged.responseTimeSum / merged.total).toFixed(2))
        : 0,
  };

  await writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(`Stats written to: ${outputPath}`);
};
