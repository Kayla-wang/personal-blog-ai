# 博客系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建基于 Docusaurus 的个人学习资料博客系统，支持分类/标签、本地搜索，并配置 GitHub Actions 自动部署。

**Architecture:** 使用 Docusaurus 3.x 生成静态站点，@easyops-cn/docusaurus-search-local 提供中文搜索，GitHub Actions 构建后通过 SSH 部署到 Nginx 服务器。

**Tech Stack:** Docusaurus 3.x, React, Node.js 18+, GitHub Actions, Nginx

---

## 文件结构

```
blog/
├── docs/                              # 文档区（学习资料）
│   ├── intro.md                       # 文档首页介绍
│   └── example-project/               # 示例项目目录
│       ├── _category_.json            # 分类配置
│       ├── plan.md                    # 学习计划示例
│       └── summary.md                 # 总结示例
├── blog/                              # 博客区（时间线内容）
│   ├── authors.yml                    # 作者信息
│   └── 2026-05-28-welcome/
│       └── index.md                   # 欢迎博文
├── src/
│   ├── components/
│   │   └── HomepageFeatures/
│   │       ├── index.js               # 首页特性组件
│   │       └── styles.module.css      # 组件样式
│   ├── pages/
│   │   └── index.js                   # 自定义首页
│   └── css/
│       └── custom.css                 # 全局自定义样式
├── static/
│   └── img/                           # 静态图片资源
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Actions 部署配置
├── docusaurus.config.js               # Docusaurus 主配置
├── sidebars.js                        # 侧边栏配置
├── package.json                       # 项目依赖
├── .gitignore                         # Git 忽略文件
└── README.md                          # 项目说明
```

---

## Task 1: 初始化 Docusaurus 项目

**Files:**
- Create: `package.json`, `docusaurus.config.js`, `sidebars.js`, `babel.config.js`
- Create: `docs/`, `blog/`, `src/`, `static/` 目录结构

- [ ] **Step 1: 清理现有文件**

删除当前空的 README.md 和 docs 目录（specs 除外），为初始化做准备。

```powershell
Remove-Item -Path "README.md" -ErrorAction SilentlyContinue
```

- [ ] **Step 2: 初始化 Docusaurus 项目**

使用 create-docusaurus 初始化项目到当前目录。

```powershell
npx create-docusaurus@latest . classic --typescript no
```

选择选项时：
- 选择 JavaScript（非 TypeScript）
- 确认覆盖现有目录

- [ ] **Step 3: 验证项目结构**

```powershell
Get-ChildItem -Name
```

Expected: 应看到 `package.json`, `docusaurus.config.js`, `sidebars.js`, `docs/`, `blog/`, `src/`, `static/`

- [ ] **Step 4: 安装依赖**

```powershell
npm install
```

Expected: 依赖安装成功，无错误

- [ ] **Step 5: 验证本地运行**

```powershell
npm run start
```

Expected: 浏览器自动打开 http://localhost:3000，显示 Docusaurus 默认页面

- [ ] **Step 6: 提交初始化**

```powershell
git add -A
git commit -m "chore: initialize Docusaurus project"
```

---

## Task 2: 配置站点基本信息

**Files:**
- Modify: `docusaurus.config.js`

- [ ] **Step 1: 修改站点配置**

编辑 `docusaurus.config.js`，替换为以下内容：

```javascript
// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '学习笔记',
  tagline: '记录学习，分享知识',
  favicon: 'img/favicon.ico',

  url: 'https://your-domain.com',
  baseUrl: '/',

  organizationName: 'your-username',
  projectName: 'blog',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: {
          showReadingTime: true,
          blogSidebarTitle: '全部文章',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '学习笔记',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '文档',
          },
          { to: '/blog', label: '博客', position: 'left' },
          { to: '/docs/tags', label: '标签', position: 'left' },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} 学习笔记`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml', 'python', 'java', 'sql'],
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),
};

module.exports = config;
```

- [ ] **Step 2: 验证配置生效**

```powershell
npm run start
```

Expected: 页面标题变为"学习笔记"，导航栏显示"文档"、"博客"、"标签"

- [ ] **Step 3: 提交配置**

```powershell
git add docusaurus.config.js
git commit -m "feat: configure site title, navbar and i18n"
```

---

## Task 3: 安装并配置本地搜索

**Files:**
- Modify: `package.json`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: 安装搜索插件**

```powershell
npm install @easyops-cn/docusaurus-search-local
```

- [ ] **Step 2: 配置搜索插件**

在 `docusaurus.config.js` 中，找到 `module.exports = config;` 之前，添加 themes 配置：

```javascript
const config = {
  // ... 现有配置 ...

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',
        indexBlog: true,
        indexDocs: true,
      }),
    ],
  ],

  // ... 其余配置 ...
};
```

- [ ] **Step 3: 验证搜索功能**

```powershell
npm run build
npm run serve
```

Expected: 导航栏出现搜索框，输入关键词可搜索文档内容

- [ ] **Step 4: 提交搜索配置**

```powershell
git add package.json package-lock.json docusaurus.config.js
git commit -m "feat: add local search with Chinese support"
```

---

## Task 4: 自定义简洁主题样式

**Files:**
- Modify: `src/css/custom.css`

- [ ] **Step 1: 替换自定义样式**

编辑 `src/css/custom.css`，替换为：

```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);
  --ifm-font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
}

[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  --ifm-color-primary-darker: #1fa588;
  --ifm-color-primary-darkest: #1a8870;
  --ifm-color-primary-light: #29d5b0;
  --ifm-color-primary-lighter: #32d8b4;
  --ifm-color-primary-lightest: #4fddbf;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}

/* 简洁的文章样式 */
.markdown {
  --ifm-heading-font-weight: 600;
}

.markdown h1 {
  font-size: 2rem;
}

.markdown h2 {
  font-size: 1.5rem;
  margin-top: 2rem;
}

/* 简洁的导航栏 */
.navbar {
  box-shadow: none;
  border-bottom: 1px solid var(--ifm-toc-border-color);
}

/* 简洁的页脚 */
.footer {
  padding: 1rem 0;
}
```

- [ ] **Step 2: 验证样式**

```powershell
npm run start
```

Expected: 页面呈现简洁风格，导航栏无阴影，配色协调

- [ ] **Step 3: 提交样式**

```powershell
git add src/css/custom.css
git commit -m "style: apply minimal theme styling"
```

---

## Task 5: 创建示例文档结构

**Files:**
- Create: `docs/intro.md`
- Create: `docs/example-project/_category_.json`
- Create: `docs/example-project/plan.md`
- Create: `docs/example-project/summary.md`
- Delete: 默认的 tutorial 文档

- [ ] **Step 1: 删除默认文档**

```powershell
Remove-Item -Path "docs/tutorial-basics" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs/tutorial-extras" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs/intro.md" -Force -ErrorAction SilentlyContinue
```

- [ ] **Step 2: 创建文档首页**

创建 `docs/intro.md`：

```markdown
---
sidebar_position: 1
slug: /
---

# 欢迎

这是我的学习笔记，记录项目学习计划、总结、架构和外部资料。

## 内容导航

- **文档区**：按项目/主题组织的学习资料
- **博客区**：按时间线发布的文章
- **标签页**：按标签筛选内容

## 如何使用

1. 通过左侧边栏浏览文档
2. 使用顶部搜索框搜索内容
3. 点击标签查看相关文章
```

- [ ] **Step 3: 创建示例项目目录**

```powershell
New-Item -ItemType Directory -Path "docs/example-project" -Force
```

- [ ] **Step 4: 创建分类配置**

创建 `docs/example-project/_category_.json`：

```json
{
  "label": "示例项目",
  "position": 2,
  "collapsed": false,
  "link": {
    "type": "generated-index",
    "description": "这是一个示例项目的学习资料"
  }
}
```

- [ ] **Step 5: 创建学习计划示例**

创建 `docs/example-project/plan.md`：

```markdown
---
sidebar_position: 1
tags: [计划, 示例]
---

# 学习计划

## 目标

- 目标 1：了解基础概念
- 目标 2：掌握核心技能
- 目标 3：完成实战项目

## 时间安排

| 阶段 | 内容 | 时间 |
|------|------|------|
| 第一周 | 基础学习 | 5h |
| 第二周 | 进阶内容 | 8h |
| 第三周 | 实战练习 | 10h |

## 资源

- [官方文档](https://example.com)
- [视频教程](https://example.com)
```

- [ ] **Step 6: 创建总结示例**

创建 `docs/example-project/summary.md`：

```markdown
---
sidebar_position: 2
tags: [总结, 示例]
---

# 项目总结

## 收获

1. 学会了 XXX
2. 理解了 YYY
3. 掌握了 ZZZ

## 遇到的问题

### 问题 1

**描述**：遇到了某个问题

**解决方案**：通过某种方式解决

## 下一步

- [ ] 深入学习某个主题
- [ ] 完成某个练习
```

- [ ] **Step 7: 验证文档结构**

```powershell
npm run start
```

Expected: 侧边栏显示"欢迎"和"示例项目"，示例项目下有"学习计划"和"项目总结"

- [ ] **Step 8: 提交文档**

```powershell
git add docs/
git commit -m "docs: add intro and example project structure"
```

---

## Task 6: 配置侧边栏

**Files:**
- Modify: `sidebars.js`

- [ ] **Step 1: 更新侧边栏配置**

编辑 `sidebars.js`，替换为：

```javascript
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'autogenerated',
      dirName: '.',
    },
  ],
};

module.exports = sidebars;
```

- [ ] **Step 2: 验证侧边栏**

```powershell
npm run start
```

Expected: 侧边栏自动生成，显示 intro 和所有子目录

- [ ] **Step 3: 提交配置**

```powershell
git add sidebars.js
git commit -m "feat: configure auto-generated sidebar"
```

---

## Task 7: 简化首页

**Files:**
- Modify: `src/pages/index.js`
- Modify: `src/components/HomepageFeatures/index.js`

- [ ] **Step 1: 简化首页组件**

编辑 `src/pages/index.js`，替换为：

```javascript
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs">
            开始阅读
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="个人学习笔记">
      <HomepageHeader />
      <main>
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Link to="/docs" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>📚 文档</h3>
                <p>学习资料与笔记</p>
              </div>
            </Link>
            <Link to="/blog" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>📝 博客</h3>
                <p>时间线文章</p>
              </div>
            </Link>
            <Link to="/docs/tags" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>🏷️ 标签</h3>
                <p>按主题浏览</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
```

- [ ] **Step 2: 更新首页样式**

编辑 `src/pages/index.module.css`，替换为：

```css
.heroBanner {
  padding: 4rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
}
```

- [ ] **Step 3: 删除默认 Features 组件**

```powershell
Remove-Item -Path "src/components/HomepageFeatures" -Recurse -Force -ErrorAction SilentlyContinue
```

- [ ] **Step 4: 验证首页**

```powershell
npm run start
```

Expected: 首页简洁展示标题、副标题和三个入口链接

- [ ] **Step 5: 提交首页**

```powershell
git add src/
git commit -m "feat: simplify homepage layout"
```

---

## Task 8: 配置博客示例

**Files:**
- Modify: `blog/authors.yml`
- Create: `blog/2026-05-28-welcome/index.md`
- Delete: 默认博客文章

- [ ] **Step 1: 删除默认博客文章**

```powershell
Remove-Item -Path "blog/*" -Recurse -Force -ErrorAction SilentlyContinue
```

- [ ] **Step 2: 创建作者配置**

创建 `blog/authors.yml`：

```yaml
default:
  name: 作者
  title: 博客作者
```

- [ ] **Step 3: 创建欢迎博文目录**

```powershell
New-Item -ItemType Directory -Path "blog/2026-05-28-welcome" -Force
```

- [ ] **Step 4: 创建欢迎博文**

创建 `blog/2026-05-28-welcome/index.md`：

```markdown
---
slug: welcome
title: 欢迎来到我的博客
authors: [default]
tags: [博客, 欢迎]
---

这是博客的第一篇文章。

<!-- truncate -->

## 关于这个博客

这个博客用于记录我的学习历程，包括：

- 项目学习计划
- 学习总结
- 技术架构
- 外部资料收集

欢迎阅读！
```

- [ ] **Step 5: 验证博客**

```powershell
npm run start
```

Expected: 点击导航栏"博客"，显示欢迎文章

- [ ] **Step 6: 提交博客**

```powershell
git add blog/
git commit -m "docs: add welcome blog post"
```

---

## Task 9: 配置 GitHub Actions 部署

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 workflows 目录**

```powershell
New-Item -ItemType Directory -Path ".github/workflows" -Force
```

- [ ] **Step 2: 创建部署配置**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Blog

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          SOURCE: build/
          TARGET: /var/www/blog
          ARGS: '-avz --delete'
```

- [ ] **Step 3: 提交部署配置**

```powershell
git add .github/
git commit -m "ci: add GitHub Actions deployment workflow"
```

---

## Task 10: 更新项目文档

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: 更新 README**

编辑 `README.md`，替换为：

```markdown
# 学习笔记博客

基于 Docusaurus 构建的个人学习资料博客。

## 本地开发

```bash
npm install
npm run start
```

## 构建

```bash
npm run build
```

## 部署

推送到 main 分支后，GitHub Actions 自动构建并部署到服务器。

### 服务器配置

需要在 GitHub 仓库 Settings > Secrets 中配置：

- `SSH_PRIVATE_KEY`: 服务器 SSH 私钥
- `REMOTE_HOST`: 服务器 IP 或域名
- `REMOTE_USER`: SSH 用户名

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/blog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

## 添加内容

### 添加文档

在 `docs/` 目录下创建 Markdown 文件或文件夹。

### 添加博客

在 `blog/` 目录下创建 `YYYY-MM-DD-title/index.md`。

## 目录结构

```
docs/           # 文档（学习资料）
blog/           # 博客（时间线文章）
src/            # 源码（页面、组件）
static/         # 静态资源
```
```

- [ ] **Step 2: 确认 .gitignore**

检查 `.gitignore` 是否包含必要内容（Docusaurus 初始化时已创建）：

```
node_modules/
build/
.docusaurus/
.cache-loader/
.DS_Store
*.log
```

- [ ] **Step 3: 提交文档**

```powershell
git add README.md .gitignore
git commit -m "docs: update README with setup instructions"
```

---

## Task 11: 最终验证

**Files:** 无新文件

- [ ] **Step 1: 完整构建测试**

```powershell
npm run build
```

Expected: 构建成功，无错误，`build/` 目录生成

- [ ] **Step 2: 本地预览构建产物**

```powershell
npm run serve
```

Expected: 浏览器打开 http://localhost:3000，所有功能正常：
- 首页显示正确
- 文档导航正常
- 搜索功能可用
- 博客页面正常
- 标签页面正常
- 明暗模式切换正常

- [ ] **Step 3: 检查所有提交**

```powershell
git log --oneline
```

Expected: 看到所有任务的提交记录

- [ ] **Step 4: 推送到远程仓库（可选）**

如果已配置远程仓库：

```powershell
git remote add origin https://github.com/your-username/blog.git
git branch -M main
git push -u origin main
```

---

## 部署检查清单

完成本地开发后，按以下步骤部署：

1. [ ] 在 GitHub/Gitee 创建仓库
2. [ ] 推送代码到远程仓库
3. [ ] 在服务器上创建部署目录：`sudo mkdir -p /var/www/blog`
4. [ ] 配置服务器 SSH 密钥对
5. [ ] 在 GitHub Secrets 中配置 `SSH_PRIVATE_KEY`、`REMOTE_HOST`、`REMOTE_USER`
6. [ ] 配置服务器 Nginx
7. [ ] 配置域名 DNS 指向服务器
8. [ ] （可选）配置 HTTPS：`sudo certbot --nginx -d your-domain.com`
9. [ ] 触发首次部署（推送到 main 分支）
10. [ ] 验证网站可访问
