import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";

export interface Config {
  outputFolder: string;
  browserProfilePath: string;
  generationTimeoutMs: number;
}

const CONFIG_DIR = join(homedir(), ".image-generation");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function defaultConfig(): Config {
  return {
    outputFolder: join(homedir(), "Downloads"),
    browserProfilePath: join(CONFIG_DIR, "browser-profile"),
    generationTimeoutMs: 180_000,
  };
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return defaultConfig();
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<Config>;
    return { ...defaultConfig(), ...raw };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(patch: Partial<Config>): void {
  const next = { ...loadConfig(), ...patch };
  mkdirSync(CONFIG_DIR, { recursive: true });
  const tmp = `${CONFIG_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  renameSync(tmp, CONFIG_PATH);
}
