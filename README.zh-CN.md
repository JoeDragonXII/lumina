# Lumina

[English](README.md)

Lumina 是一个本地优先的个人摄影档案应用。它提供公开展示的图库，以及用于管理图集、地点、时间线和地图视图的密码保护工作室。

你的照片库保留在运行 Lumina 的本机上。应用使用 SQLite 保存元数据，并将导入的媒体存放在可配置的本地数据目录中。

## 功能

- 公开首页、图集、时间线、作品和地图视图
- 用于管理图集和照片库的 Studio 后台
- 支持中国及区域层级的地点地图导航
- 使用 Drizzle ORM 操作 SQLite 元数据
- 使用 `exifr`、ExifTool 和 Sharp 提取元数据并生成预览
- 带清单和 SQLite 快照的本地备份
- 不依赖托管数据库或外部媒体服务

## 环境要求

- Node.js 20 或更高版本
- pnpm 9 或更高版本
- Windows、macOS 或 Linux

## 快速开始

```bash
pnpm install
cp frontend/.env.example frontend/.env.local
pnpm dev
```

然后打开 [http://localhost:3002](http://localhost:3002)。

Windows PowerShell 请使用 `Copy-Item frontend/.env.example frontend/.env.local` 替代 `cp`。

正式使用 Studio 前，请在 `frontend/.env.local` 中设置强密码 `ADMIN_PASSWORD` 和随机的 `AUTH_COOKIE_SECRET`。

## 配置

支持的环境变量详见 [`frontend/.env.example`](frontend/.env.example)：

| 变量 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD` | `/studio` 及后台 API 的密码 |
| `AUTH_COOKIE_SECRET` | 用于签名后台会话 Cookie 的密钥 |
| `NEXT_PUBLIC_SITE_NAME` | 公开站点名称 |
| `NEXT_PUBLIC_SITE_OWNER` | 可选的站点所有者名称 |
| `PHOTO_ARCHIVE_DATA_DIR` | SQLite 数据库和媒体库的可选路径 |
| `PHOTO_ARCHIVE_BACKUP_DIR` | 本地备份的可选路径 |

如果不设置数据目录变量，Lumina 会在项目目录下使用 `.local-data/` 和 `.local-backups/`。这些目录已被 Git 忽略。请勿提交真实照片、数据库、备份、密码或密钥。

## 路由

| 路由 | 说明 |
| --- | --- |
| `/` | 公开首页 |
| `/archive` | 图集归档 |
| `/works` | 作品和图集视图 |
| `/timeline` | 时间线视图 |
| `/map` | 全球及区域地图导航 |
| `/studio` | 密码保护的管理后台 |

## 常用命令

```bash
pnpm dev          # 启动 3002 端口的本地开发服务
pnpm build        # 创建生产构建
pnpm start        # 在 3002 端口运行生产构建
pnpm lint         # 运行 ESLint
pnpm typecheck    # 检查前后端类型
pnpm test:run     # 运行单元测试
pnpm test:e2e     # 运行 Playwright 端到端测试
```

## 项目结构

```text
frontend/   Next.js 路由、React 组件、样式和公开资源
backend/    SQLite、媒体处理、备份、地点逻辑和输入校验
tests/      单元测试和 Playwright 端到端测试
scripts/    本地开发工具
```

前端使用 `@/*` 引用 `frontend/*`，使用 `@backend/*` 引用后端模块。API 路由保持薄层，业务逻辑放在 `backend/` 中。

## 数据与备份

Lumina 面向个人本地数据设计。备份写入配置的备份目录，包含 SQLite 数据库和清单文件。请按照自己的存储策略保护并备份这些目录。

## 许可证

当前尚未声明许可证。
