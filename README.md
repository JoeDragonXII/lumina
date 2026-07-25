# Lumina

本地优先的个人摄影网站，用统一内容库管理单张作品和多图图集，并通过作品页、时间线和亚洲地图公开展示。

管理入口 `/studio` 需要密码；公开站无需登录即可浏览。

> 开发工作区可能含协作文档和 AI Agent 会话数据，但它们不会进入 Git 或发布包。运行 `scripts/pack-release.ps1` 可导出到项目内的 `lumina-release/`。

---

## 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9（`npm i -g pnpm`）
- **Windows / macOS / Linux**（本地 SQLite 无需额外服务）

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（可选，不配置也能跑起来）
cp frontend/.env.example frontend/.env.local
# 编辑 .env.local，至少设置 ADMIN_PASSWORD 和 AUTH_COOKIE_SECRET

# 3. 启动
pnpm dev
```

浏览器打开 `http://localhost:3002`

> 默认管理密码 `1234`，正式使用前务必改掉。

---

## 项目结构

```
lumina/
├── frontend/                  # Next.js 前端（页面、组件、样式、API 路由）
│   ├── app/                   # App Router 页面
│   │   ├── (public)/          # 公开页面组（首页、图集）
│   │   ├── (studio)/          # 管理后台（需登录）
│   │   └── api/               # API 路由（薄层，业务逻辑在 backend）
│   ├── components/            # 通用 UI 组件（来自 Aceternity UI）
│   ├── modules/               # 前端业务模块
│   │   ├── core/              # 站点配置常量
│   │   └── public/            # 公开页面组件
│   └── public/                # 静态资源
├── backend/                   # 后端业务逻辑
│   ├── drizzle/               # SQLite 数据库迁移
│   ├── modules/               # 领域模块
│   └── data/                  # 地图静态数据
├── tests/                     # 测试
│   ├── e2e/                   # 端到端测试（Playwright）
│   └── support/               # 测试工具
├── scripts/                   # 工具脚本
│   └── start-local.ps1        # Windows 本地启动脚本
├── package.json               # 依赖 & 脚本
├── pnpm-workspace.yaml        # pnpm workspace 配置
├── drizzle.config.ts          # 数据库迁移配置
├── vitest.config.ts           # 单元测试配置
├── playwright.config.ts       # E2E 测试配置
└── eslint.config.mjs          # ESLint 配置
```

### 路径别名

| 别名 | 映射 |
|------|------|
| `@/*` | `frontend/*` |
| `@backend/*` | `backend/*` |

前端内部用 `@/*`，跨层调用后端用 `@backend/*`。

### 关键约定

- `frontend/app/api/` 保持薄层，业务逻辑放在 `backend/`
- 本地数据目录 `.local-data/`（SQLite + 照片）已被 Git 忽略
- 备份目录 `.local-backups/` 已被 Git 忽略
- 测试数据目录 `.test-data/` 已被 Git 忽略

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 (localhost:3002) |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | 前后端类型检查 |
| `pnpm test:run` | 运行单元测试 |
| `pnpm test:e2e` | 运行 E2E 测试（需要 Node 环境，推荐用本机 Edge） |
| `scripts/pack-release.ps1` | 导出到 `lumina-release/`；保留其中的 Git 历史并剔除开发辅助内容 |

---

## 环境变量

参考 `frontend/.env.example`：

```env
ADMIN_PASSWORD=你的管理密码
AUTH_COOKIE_SECRET=随机安全字符串
NEXT_PUBLIC_SITE_NAME=Lumina
NEXT_PUBLIC_SITE_OWNER=你的名字
# 可选：自定义数据目录
# PHOTO_ARCHIVE_DATA_DIR=D:\Photos\data
# PHOTO_ARCHIVE_BACKUP_DIR=D:\Photos\backups
```

---

## 技术栈

- **框架**: Next.js 16 + React 19
- **数据库**: SQLite（better-sqlite3 + Drizzle ORM）
- **UI**: Tailwind CSS v4 + Aceternity UI + motion
- **图片处理**: sharp + exifr + exiftool-vendored
- **地图**: d3-geo + topojson-client + world-atlas
- **测试**: Vitest + Playwright
- **包管理**: pnpm

---

## FAQ

**Q: 照片存在哪？**
A: 默认在项目根目录 `.local-data/media/`，可通过环境变量改路径。

**Q: 支持哪些照片格式？**
A: JPEG、PNG、WebP、HEIC，以及 RAW（ARW/CR2 等，通过 exiftool-vendored 提取缩略图）。

**Q: 怎么恢复备份？**
A: 备份在 `.local-backups/backup-<时间戳>/`，每份包含 `library.sqlite` 和 `manifest.json`。覆盖 `.local-data/` 对应文件即可恢复。
