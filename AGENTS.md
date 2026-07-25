# Agent 项目指南

本文件供 AI Agent 阅读，帮助快速理解项目结构并正确修改代码。

---

## 项目概览

这是 **Lumina**，一个本地运行的个人摄影档案网站，使用 SQLite 存储元数据、文件系统存储照片。

- 公开站：首页、图集 (`/archive`)、地图、时间线
- 管理后台：`/studio`（需密码登录，默认密码 `1234`）
- 开发端口：`http://localhost:3002`

> 开发工作区可能含 `docs/` 设计文档、`collab/` 协作文档和 `.codebuddy/` 会话数据，三者已被 Git 忽略且不会进入发布包。开发工作区可运行 `scripts/pack-release.ps1` 导出干净副本。

---

## 目录边界

```
frontend/          → Next.js 页面、React 组件、样式、浏览器状态、HTTP 适配
backend/           → 数据库操作、文件系统、媒体处理、地图推断、备份、输入校验
tests/             → 端到端测试 (e2e/) 和测试工具 (support/)
scripts/           → 本地工具脚本（含 pack-release.ps1 发布包导出）
data/              → 私有 JSON 数据（已被 Git 忽略）
docs/              → 设计文档（已被 Git 忽略）
collab/            → 多 Agent 协作文档（任务卡、复核、交换；已被 Git 忽略）
```

### 导入规则

| 场景 | 路径别名 |
|------|----------|
| 前端内部引用 | `@/*` → `frontend/*` |
| 前端调用后端 | `@backend/*` |
| 后端内部引用 | `@backend/*` |

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `frontend/app/(public)/page.tsx` | **首页**：瀑布流照片墙 + 全局背景 |
| `frontend/app/(public)/archive/page.tsx` | **图集页**：CSS Grid + 分类筛选 |
| `frontend/app/(public)/layout.tsx` | 公开页布局（含 BackgroundProvider） |
| `frontend/modules/core/site.ts` | 站点配置：名称、分类、默认背景图 |
| `frontend/modules/public/components/BackgroundContext.tsx` | 全局背景模式（极光/照片切换） |
| `frontend/modules/public/components/GlobalBackground.tsx` | 背景渲染组件 |
| `frontend/modules/public/components/HomeDockNav.tsx` | 左侧浮动导航栏 |
| `frontend/modules/public/components/PublicExperienceShell.tsx` | 公开页动画外壳 |
| `frontend/modules/public/components/PhotoModal.tsx` | 照片大图弹窗 |
| `frontend/modules/public/components/MasonryFlowWall.tsx` | 首页瀑布流组件 |
| `frontend/components/ui/` | Aceternity UI 组件库 |
| `frontend/app/globals.css` | 全局样式（CSS 变量、主题） |
| `backend/modules/` | 业务逻辑（DB / 媒体 / 位置等） |
| `backend/drizzle/` | Drizzle ORM 迁移文件 |

---

## 开发命令

```bash
pnpm dev              # 启动 (localhost:3002)
pnpm build            # 生产构建
pnpm lint             # ESLint
pnpm typecheck        # 类型检查（前后端一起）
pnpm test:run         # 单元测试
pnpm test:e2e         # E2E 测试
```

---

## 发布包导出

```bash
# 导出干净副本到 ./lumina-release/
powershell -ExecutionPolicy Bypass -File scripts/pack-release.ps1
```

导出内容：所有源码 + 配置 + AGENTS.md，剔除 `.local-data/`、`docs/`、`.codebuddy/`、`node_modules/` 等。`lumina-release/` 可作为长期 Git 仓库；导出前必须保持其工作树干净。

---

## 安全红线

- **禁止**删除、移动或提交 `.local-data/`、`.local-backups/`、`.test-data/`
- **禁止**提交 `.env.local`、真实密码、密钥、用户照片原件
- **禁止**修改 `.gitignore` 中关于数据目录和协作目录的规则
- `docs/`、`collab/` 和 `.codebuddy/` 为开发辅助目录，**禁止**提交到 Git

---

## 开发约定

1. `frontend/app/api/` 保持薄层，不写业务逻辑
2. 新页面放在 `frontend/app/(public)/` 下（自动获得公开页布局和背景切换能力）
3. 可复用 UI 组件放在 `frontend/components/ui/`，业务组件放在 `frontend/modules/`
4. 修改前先读相关文件，不要凭猜测改写
5. 避免引入新依赖，优先使用已有的 Aceternity UI 组件
