# GitHub Pages 免费公开镜像 — 设计文档

日期:2026-07-24
仓库:`Kayla-wang/personal-blog-ai`

## 目标

在**保留现有阿里云服务器部署完全不变**(完整功能,含 AI 聊天)的前提下,新增一个 GitHub Pages 免费公开镜像:

- 公开地址:`https://kayla-wang.github.io/personal-blog-ai/`
- Pages 镜像**隐藏 AI 聊天组件**(Pages 无后端,`/api/chat` 调不通)
- 每次推送 `main`,服务器部署与 Pages 镜像**都**自动更新

## 方案:环境变量参数化(单份 config)

备选是维护两份 `docusaurus.config.js`,但重复度高、易漂移。采用单份 config + 环境变量 `DEPLOY_TARGET` 区分构建目标。

### 1. 参数化 `docusaurus.config.js`

- 读环境变量 `DEPLOY_TARGET`,取值 `pages` 或默认 `server`。
- 按目标切换字段:

  | 字段 | `pages` | `server`(默认) |
  |---|---|---|
  | `url` | `https://kayla-wang.github.io` | 占位符 `https://your-domain.com`(暂无域名) |
  | `baseUrl` | `/personal-blog-ai/` | `/` |

- 修正 `organizationName``Kayla-wang`、`projectName``personal-blog-ai`(当前为占位符 `your-username` / `blog`)。
- 新增 `customFields.enableChat = process.env.DEPLOY_TARGET !== 'pages'`。

### 2. 条件隐藏聊天组件 `src/theme/Root.js`

- 用 `useDocusaurusContext()` 读 `siteConfig.customFields.enableChat`。
- 为 `false` 时不渲染 `<AIChatWidget />`;`true`(默认/server)时正常渲染。

### 3. 工作流

- 现有 `.github/workflows/deploy.yml`**完全不动**:走默认 `server` 配置,SSH 部署到阿里云 + 重启 API。
- 新增 `.github/workflows/gh-pages.yml`:
  - 触发:`push` 到 `main`(与服务器部署并行)。
  - 步骤:checkout → setup-node 20 → `npm ci` → `DEPLOY_TARGET=pages npm run build` → GitHub 官方 Pages actions(`actions/configure-pages` / `actions/upload-pages-artifact` 上传 `build/` / `actions/deploy-pages`)。
  - 权限:`pages: write`、`id-token: write`;并发组避免重复部署。

## 用户需手动完成的前置(代码无法覆盖)

1. **GitHub 仓库 Settings → Pages → Source 选 "GitHub Actions"** — 已完成(见配置截图)。
2. **仓库需为 public** — 免费/Pro 个人账号用官方 Actions 发布公开 Pages 的前提;若为 private 需 GitHub Enterprise 或改为 public。**待用户确认当前可见性。**

## 说明与边界

- 服务器版 `url` 占位符不影响相对路径访问,仅影响 sitemap/canonical/SEO;有域名后再替换。
- `baseUrl` 变化时 Docusaurus 自动为内部链接加前缀,`onBrokenLinks: 'throw'` 下不会产生坏链。
- 搜索插件的 `docsRouteBasePath: ['/notes', '/projects']` 是路由基路径,不受 `baseUrl` 影响,无需改动。
- 两个工作流同时触发是预期行为(用户明确要"两者都要")。

## 不做(YAGNI)

- 不把 Pages 聊天指向服务器 API(用户选择隐藏,省去 CORS 配置)。
- 不改动 `server/` 与 `api/` 后端。
- 不做无关重构。
