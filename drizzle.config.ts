import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./backend/modules/library/server/schema.ts",
  out: "./backend/drizzle",
  dbCredentials: {
    url: process.env.PHOTO_ARCHIVE_DB_PATH || ".local-data/library.sqlite",
  },
});
