import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: workspaceRoot,
  // exifr loads Node's fs/zlib dynamically; let Node resolve them at runtime.
  serverExternalPackages: ["better-sqlite3", "exiftool-vendored", "exifr", "sharp"],
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
