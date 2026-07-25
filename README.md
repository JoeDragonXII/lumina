# Lumina

[简体中文](README.zh-CN.md)

Lumina is a local-first personal photography archive. It combines a public-facing gallery with a password-protected studio for organizing collections, locations, timelines, and map views.

Your library stays on the machine running Lumina. The application stores metadata in SQLite and keeps imported media in a configurable local data directory.

## Features

- Public home, archive, timeline, works, and map views
- Studio for collection and library management
- Location-aware map navigation, including China and regional views
- SQLite metadata with Drizzle ORM
- Image metadata and preview processing with `exifr`, ExifTool, and Sharp
- Local backups with a manifest and SQLite snapshot
- No hosted database or external media service required

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer
- Windows, macOS, or Linux

## Quick start

```bash
pnpm install
cp frontend/.env.example frontend/.env.local
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002).

On Windows PowerShell, use `Copy-Item frontend/.env.example frontend/.env.local` instead of `cp`.

Before using the Studio in any real environment, set a strong `ADMIN_PASSWORD` and `AUTH_COOKIE_SECRET` in `frontend/.env.local`.

## Configuration

The supported variables are documented in [`frontend/.env.example`](frontend/.env.example):

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/studio` and studio API routes |
| `AUTH_COOKIE_SECRET` | Secret used to sign the studio session cookie |
| `NEXT_PUBLIC_SITE_NAME` | Public site name |
| `NEXT_PUBLIC_SITE_OWNER` | Optional owner label shown by the public site |
| `PHOTO_ARCHIVE_DATA_DIR` | Optional path for the SQLite database and media library |
| `PHOTO_ARCHIVE_BACKUP_DIR` | Optional path for local backups |

If the data directory variables are omitted, Lumina uses `.local-data/` and `.local-backups/` in the project directory. These directories are intentionally ignored by Git. Do not commit real photographs, databases, backups, passwords, or secrets.

## Routes

| Route | Description |
| --- | --- |
| `/` | Public home |
| `/archive` | Collection archive |
| `/works` | Works and collection views |
| `/timeline` | Timeline view |
| `/map` | Global and regional map navigation |
| `/studio` | Password-protected management interface |

## Common commands

```bash
pnpm dev          # Start the local development server on port 3002
pnpm build        # Create a production build
pnpm start        # Serve the production build on port 3002
pnpm lint         # Run ESLint
pnpm typecheck    # Check frontend and backend types
pnpm test:run     # Run unit tests
pnpm test:e2e     # Run Playwright end-to-end tests
```

## Project structure

```text
frontend/   Next.js routes, React components, styles, and public assets
backend/    SQLite, media processing, backups, location logic, and validation
tests/      Unit and Playwright end-to-end tests
scripts/    Local development utilities
```

The frontend uses `@/*` for `frontend/*` and `@backend/*` for backend imports. API route files are kept thin; business logic belongs in `backend/`.

## Data and backups

Lumina is designed for personal, local data. Backups are written to the configured backup directory and include the SQLite library plus a manifest. Keep the data and backup directories private and back them up using your normal storage policy.

## License

No license has been declared yet.
