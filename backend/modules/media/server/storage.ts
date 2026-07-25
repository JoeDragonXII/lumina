import "server-only";

import path from "path";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { getDataRoot } from "@backend/modules/library/server/database";

export function getMediaRoot() {
  return path.join(getDataRoot(), "media");
}

export function getOriginalsRoot() {
  return path.join(getMediaRoot(), "originals");
}

export function getDerivedRoot() {
  return path.join(getMediaRoot(), "derived");
}

export function toDataRelativePath(absolutePath: string) {
  return path.relative(getDataRoot(), absolutePath).replaceAll("\\", "/");
}

export function resolveDataPath(relativePath: string) {
  const root = path.resolve(getDataRoot());
  const resolved = path.resolve(root, /* turbopackIgnore: true */ relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid media path");
  return resolved;
}

export async function writeStoredFile(absolutePath: string, content: Buffer) {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
}

export async function readStoredFile(relativePath: string) {
  return readFile(resolveDataPath(relativePath));
}

export async function removeStoredAsset(assetId: string, originalAbsolutePath: string) {
  await Promise.all([
    rm(originalAbsolutePath, { force: true }),
    rm(path.join(getDerivedRoot(), assetId), { recursive: true, force: true }),
  ]);
}
