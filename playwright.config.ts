import path from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { defineConfig, devices } from "@playwright/test";

const testDataRoot = mkdtempSync(path.join(tmpdir(), "lumina-playwright-"));

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3012",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Edge"],
    channel: "msedge",
  },
  webServer: {
    command: ".\\node_modules\\.bin\\next.cmd dev frontend -p 3012",
    url: "http://127.0.0.1:3012",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      PHOTO_ARCHIVE_DATA_DIR: testDataRoot,
      PHOTO_ARCHIVE_DB_PATH: path.join(testDataRoot, "library.sqlite"),
      PHOTO_ARCHIVE_BACKUP_DIR: path.join(testDataRoot, "backups"),
      ADMIN_PASSWORD: "1234",
      ADMIN_AUTH_REQUIRED: "true",
      AUTH_COOKIE_SECRET: "playwright-local-secret",
    },
  },
});
