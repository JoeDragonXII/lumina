import path from "path";
import { defineConfig, devices } from "@playwright/test";

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
      PHOTO_ARCHIVE_DATA_DIR: path.join(process.cwd(), ".test-data", `playwright-${process.pid}`),
      ADMIN_PASSWORD: "1234",
      AUTH_COOKIE_SECRET: "playwright-local-secret",
    },
  },
});
