# 博客系统设计文档

## 概述

基于 Docusaurus 构建的个人学习资料博客系统，用于存放项目学习计划、总结、架构文档和外部资料。代码托管在 GitHub/Gitee，部署到自有服务器，通过自定义域名访问。

## 设计目标

- 简洁的页面风格
- 支持分类/标签组织内容
- 支持全文搜索
- 基础浏览功能（目录导航 + 文章阅读）
- 使用 Markdown 编写内容
- 自动化部署流程

## 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 框架 | Docusaurus 3.x | React 生态，专为文档/知识库设计，开箱即用 |
| 搜索 | @easyops-cn/docusaurus-search-local | 本地搜索，支持中文，无需第三方服务 |
| 主题 | @docusaurus/preset-classic | 简洁默认主题，支持明暗模式 |
| 部署 | GitHub Actions + SSH/rsync | 自动化构建部署 |
| 服务器 | Linux + Nginx | 成本低，稳定，适合静态托管 |

## 整体架构

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   GitHub/    │      │   GitHub     │      │   服务器      │
│   Gitee      │ ───▶ │   Actions    │ ───▶ │   Nginx      │
│   (源码仓库)  │      │   (自动构建)  │      │   (静态托管)  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │  自定义域名   │
                                            └──────────────┘
```

**工作流程：**
1. 本地用 Markdown 编写文章
2. 提交并推送到 GitHub/Gitee
3. GitHub Actions 自动触发构建
4. 构建产物通过 SSH/rsync 部署到服务器
5. Nginx 托管静态文件，用户通过域名访问

## 项目结构

```
blog/
├── docs/                    # 文档区（学习资料主目录）
│   ├── project-a/           # 项目 A 的学习资料
│   │   ├── _category_.json  # 分类配置
│   │   ├── plan.md          # 学习计划
│   │   ├── summary.md       # 总结
│   │   └── architecture.md  # 架构
│   ├── project-b/
│   └── ...
│
├── blog/                    # 博客区（可选，时间线型内容）
│   └── 2026-05-28-xxx.md
│
├── src/
│   └── pages/               # 自定义页面
│       └── index.js         # 首页
│
├── static/                  # 静态资源（图片等）
├── docusaurus.config.js     # 站点配置
├── sidebars.js              # 侧边栏导航配置
└── package.json
```

## 内容组织

### 文档结构
- 按项目/主题分文件夹存放在 `docs/` 目录
- 每个文件夹可包含 `_category_.json` 定义分类信息
- 侧边栏根据文件夹结构自动生成

### 文章格式
使用 Markdown 前置元数据定义标题和标签：

```markdown
---
title: 文章标题
tags: [标签1, 标签2]
sidebar_position: 1
---

正文内容...
```

### 分类方式
- **文件夹分类**：按项目/主题划分目录
- **标签分类**：跨项目的主题标签（如：React、架构、计划）

## 功能特性

### 搜索
- 插件：`@easyops-cn/docusaurus-search-local`
- 特点：
  - 纯前端实现，构建时生成索引
  - 支持中文分词
  - 无需 Algolia 等第三方服务

### 导航
- **顶部导航栏**：首页、文档、标签页
- **左侧边栏**：按文件夹自动生成，支持折叠展开
- **右侧目录**：文章内标题导航（TOC）
- **文章导航**：上一篇/下一篇链接

### 主题
- 使用 Docusaurus classic 主题
- 简洁配色风格
- 支持明暗模式切换
- 响应式布局，移动端适配

### 代码展示
- 语法高亮（Prism.js）
- 支持行号显示
- 支持代码块标题

## 部署方案

### 服务器要求
- 操作系统：Linux (Ubuntu 20.04+ / CentOS 7+)
- Web 服务器：Nginx
- 资源需求：1 核 1G 内存足够
- 部署目录：`/var/www/blog`

### GitHub Actions 配置

```yaml
name: Deploy Blog

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
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
```

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

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### HTTPS 配置
- 使用 Let's Encrypt 免费证书
- 通过 Certbot 自动申请和续期

```bash
sudo certbot --nginx -d your-domain.com
```

### 域名配置
- 在域名服务商处添加 A 记录
- 指向服务器公网 IP

## Gitee 备选方案

如果使用 Gitee 而非 GitHub：
- 使用 Gitee Go 进行 CI/CD（配置类似）
- 或配置 Webhook 触发服务器端部署脚本

## 后续扩展（可选）

以下功能不在首期范围，但架构支持后续添加：
- RSS 订阅
- 文章阅读统计
- 评论系统（Giscus/Waline）
- 多语言支持
