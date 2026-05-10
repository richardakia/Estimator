import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const isWin = process.platform === "win32";

type ServiceSpec = {
  label: string;
  color: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
};

const services: ServiceSpec[] = [
  {
    label: "API",
    color: "\x1b[36m",
    args: ["--filter", "@workspace/api-server", "run", "dev"],
  },
  {
    label: "WEB",
    color: "\x1b[35m",
    args: ["--filter", "@workspace/cable-estimator", "run", "dev"],
    env: {
      ...process.env,
      PORT: process.env.PORT ?? "3000",
      BASE_PATH: process.env.BASE_PATH ?? "/",
    },
  },
];
const RESET = "\x1b[0m";

const children: ChildProcess[] = [];

function prefixWrite(label: string, color: string, chunk: Buffer) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.length === 0) continue;
    process.stdout.write(`${color}[${label}]${RESET} ${line}\n`);
  }
}

function startService(spec: ServiceSpec) {
  const child = spawn("pnpm", spec.args, {
    cwd: ROOT,
    shell: isWin,
    env: spec.env ?? process.env,
  });
  child.stdout?.on("data", (c) => prefixWrite(spec.label, spec.color, c));
  child.stderr?.on("data", (c) => prefixWrite(spec.label, spec.color, c));
  child.on("exit", (code) => {
    process.stdout.write(
      `${spec.color}[${spec.label}]${RESET} process exited with code ${code}\n`,
    );
    shutdown(code ?? 1);
  });
  children.push(child);
}

let shuttingDown = false;
function shutdown(code: number) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill(isWin ? undefined : "SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting Cable Estimator (API + Web)...");
console.log("Press Ctrl+C to stop both.");
for (const spec of services) startService(spec);
