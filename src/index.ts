import { startServer } from "./server";

// Simple CLI arg handling
const args = process.argv.slice(2);
const scanPaths: string[] = [];
let port = 3000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (!arg) {
    continue;
  }

  if (arg === "--port" || arg === "-p") {
    const val = parseInt(args[i + 1] ?? "", 10);
    if (!isNaN(val)) {
      port = val;
      i++; // skip next arg
    }
  } else {
    scanPaths.push(arg);
  }
}

const pathsToScan = scanPaths.length > 0 ? scanPaths : undefined;

startServer(pathsToScan, port);
