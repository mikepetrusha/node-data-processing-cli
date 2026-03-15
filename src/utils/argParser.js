export const parseArgs = (args) => {
  const res = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        res[key] = args[i + 1];
      } else {
        res[key] = true;
      }
    }
  }

  return res;
};
