import { readFileSync } from "fs";
import { join } from "path";

const agentDir = join(process.cwd(), "agent");

function readAgentFile(filename: string): string {
  try {
    return readFileSync(join(agentDir, filename), "utf-8");
  } catch {
    throw new Error(`Cannot read agent file '${filename}' from '${agentDir}'. Make sure the agent/ directory is deployed alongside the server.`);
  }
}

export function getZkAgentJs(): string {
  return readAgentFile("zk-agent.js");
}

export function getAgentPackageJson(): string {
  return readAgentFile("package.json");
}

export function getMdbAgentJs(): string {
  return readAgentFile("mdb-agent.js");
}

export function getMdbPackageJson(): string {
  return readAgentFile("mdb-package.json");
}
