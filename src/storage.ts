import { accessSync, constants, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { loadConfig } from "./config.js";

function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

export function resolveOutputDir(requestedPath?: string): string {
  if (requestedPath) {
    accessSync(requestedPath, constants.W_OK);
    return requestedPath;
  }
  const configured = loadConfig().outputFolder;
  accessSync(configured, constants.W_OK);
  return configured;
}

export function uniqueFilePath(dir: string, filename: string): string {
  const ext = extname(filename) || ".png";
  const base = sanitizeName(filename.endsWith(ext) ? filename : `${filename}${ext}`);
  const stem = base.slice(0, base.length - ext.length);
  let candidate = join(dir, base);
  let counter = 1;
  while (accessSyncSafe(candidate)) {
    candidate = join(dir, `${stem}-${counter}${ext}`);
    counter += 1;
  }
  return candidate;
}

function accessSyncSafe(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function saveImage(buffer: Buffer, filePath: string): string {
  writeFileSync(filePath, buffer);
  return filePath;
}
