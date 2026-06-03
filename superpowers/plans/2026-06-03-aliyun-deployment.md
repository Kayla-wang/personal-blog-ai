# 阿里云轻量服务器部署实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 部署博客到阿里云轻量服务器，支持静态站托管和 AI 聊天后端 API

**Architecture:** Nginx 托管静态文件 + 反向代理 /api/* 到 Node.js Express 服务。PM2 管理 Node.js 进程。GitHub Actions 自动部署静态站。

**Tech Stack:** Express.js, Vercel AI SDK (@ai-sdk/openai-compatible), PM2, Nginx, GitHub Actions

---

## 文件结构

**新建文件：**
- `server/package.json` - 后端依赖配置
- `server/index.js` - Express 入口
- `server/routes/chat.js` - AI 聊天路由
- `server/.env.example` - 环境变量模板
- `server/ecosystem.config.cjs` - PM2 配置
- `deploy/nginx.conf` - Nginx 配置参考
- `deploy/setup-server.sh` - 服务器初始化脚本

**修改文件：**
- `.github/workflows/deploy.yml` - 更新部署流程
- `CLAUDE.md` - 更新项目文档

---

## Task 1: 创建 server 目录和 package.json

**Files:**
- Create: `server/package.json`

- [ ] **Step 1: 创建 server 目录**

```powershell
New-Item -ItemType Directory -Path server -Force
```

- [ ] **Step 2: 创建 package.json**

创建 `server/package.json`：

```json
{
  "name": "blog-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@ai-sdk/openai-compatible": "^0.2.0",
    "ai": "^4.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0"
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add server/package.json
git commit -m "chore(server): init package.json with dependencies"
```

---

## Task 2: 创建 Express 服务入口

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: 创建 index.js**

创建 `server/index.js`：

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

- [ ] **Step 2: 提交**

```bash
git add server/index.js
git commit -m "feat(server): add Express entry point with health check"
```

---

## Task 3: 创建 AI 聊天路由

**Files:**
- Create: `server/routes/chat.js`

- [ ] **Step 1: 创建 routes 目录**

```powershell
New-Item -ItemType Directory -Path server/routes -Force
```

- [ ] **Step 2: 创建 chat.js**

创建 `server/routes/chat.js`：

```javascript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { Router } from 'express';

const router = Router();

const provider = createOpenAICompatible({
  name: process.env.AI_PROVIDER || 'openai',
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const result = streamText({
      model: provider(process.env.AI_MODEL || 'gpt-3.5-turbo'),
      messages,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

- [ ] **Step 3: 提交**

```bash
git add server/routes/chat.js
git commit -m "feat(server): add AI chat route with streaming response"
```

---

## Task 4: 创建环境变量模板

**Files:**
- Create: `server/.env.example`

- [ ] **Step 1: 创建 .env.example**

创建 `server/.env.example`：

```bash
# Server
PORT=3001

# AI Provider Configuration
# Provider name (for logging/identification)
AI_PROVIDER=openai

# API endpoint base URL
# OpenAI: https://api.openai.com/v1
# DeepSeek: https://api.deepseek.com/v1
# 阿里通义: https://dashscope.aliyuncs.com/compatible-mode/v1
AI_BASE_URL=https://api.openai.com/v1

# API Key
AI_API_KEY=sk-your-api-key-here

# Model name
# OpenAI: gpt-3.5-turbo, gpt-4
# DeepSeek: deepseek-chat
# 通义: qwen-turbo, qwen-plus
AI_MODEL=gpt-3.5-turbo
```

- [ ] **Step 2: 添加 .env 到 .gitignore**

在项目根目录 `.gitignore` 末尾添加：

```
# Server environment
server/.env
```

- [ ] **Step 3: 提交**

```bash
git add server/.env.example .gitignore
git commit -m "chore(server): add environment template and gitignore"
```

---

## Task 5: 创建 PM2 配置

**Files:**
- Create: `server/ecosystem.config.cjs`

- [ ] **Step 1: 创建 ecosystem.config.cjs**

创建 `server/ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [
    {
      name: 'blog-api',
      script: './index.js',
      cwd: '/var/www/blog-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
```

- [ ] **Step 2: 提交**

```bash
git add server/ecosystem.config.cjs
git commit -m "chore(server): add PM2 ecosystem config"
```

---

## Task 6: 创建部署配置文件

**Files:**
- Create: `deploy/nginx.conf`
- Create: `deploy/setup-server.sh`

- [ ] **Step 1: 创建 deploy 目录**

```powershell
New-Item -ItemType Directory -Path deploy -Force
```

- [ ] **Step 2: 创建 nginx.conf**

创建 `deploy/nginx.conf`：

```nginx
# /etc/nginx/sites-available/blog
# 使用时替换 YOUR_DOMAIN 为实际域名

server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;

    # SSL 证书路径 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    root /var/www/blog;
    index index.html;

    # 静态站
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

- [ ] **Step 3: 创建 setup-server.sh**

创建 `deploy/setup-server.sh`：

```bash
#!/bin/bash
# 阿里云轻量服务器初始化脚本
# 以 root 用户执行

set -e

echo "=== 更新系统 ==="
apt update && apt upgrade -y

echo "=== 安装 Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== 安装 PM2 ==="
npm install -g pm2

echo "=== 安装 Nginx ==="
apt install -y nginx

echo "=== 安装 Certbot (Let's Encrypt) ==="
apt install -y certbot python3-certbot-nginx

echo "=== 创建部署目录 ==="
mkdir -p /var/www/blog
mkdir -p /var/www/blog-api

echo "=== 设置目录权限 ==="
chown -R www-data:www-data /var/www/blog
chown -R $SUDO_USER:$SUDO_USER /var/www/blog-api

echo "=== 配置 PM2 开机启动 ==="
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo "=== 完成 ==="
echo ""
echo "后续步骤："
echo "1. 将 deploy/nginx.conf 复制到 /etc/nginx/sites-available/blog"
echo "2. 替换 YOUR_DOMAIN 为实际域名"
echo "3. ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/"
echo "4. nginx -t && systemctl reload nginx"
echo "5. certbot --nginx -d YOUR_DOMAIN"
echo "6. 部署 API: cd /var/www/blog-api && npm install && pm2 start ecosystem.config.cjs"
echo "7. pm2 save"
```

- [ ] **Step 4: 提交**

```bash
git add deploy/
git commit -m "chore(deploy): add nginx config and server setup script"
```

---

## Task 7: 更新 GitHub Actions 部署流程

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: 更新 deploy.yml**

将 `.github/workflows/deploy.yml` 替换为：

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
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy static site to server
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          SOURCE: build/
          TARGET: /var/www/blog
          ARGS: '-avz --delete'

      - name: Deploy API and restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.REMOTE_HOST }}
          username: ${{ secrets.REMOTE_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/blog-api
            git pull origin main 2>/dev/null || echo "Not a git repo, skipping pull"
            npm install --production
            pm2 reload blog-api || pm2 start ecosystem.config.cjs
```

- [ ] **Step 2: 提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: update deploy workflow for Aliyun server"
```

---

## Task 8: 更新 CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 CLAUDE.md**

将 `CLAUDE.md` 替换为：

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Docusaurus 3.x 构建的个人学习笔记博客，使用 React 19。支持本地中文搜索，集成 AI 聊天助手。

## 常用命令

```bash
# 前端开发
npm install     # 安装依赖
npm run start   # 启动开发服务器 (localhost:3000)
npm run build   # 生产构建
npm run serve   # 预览生产构建
npm run clear   # 清除缓存

# API 后端开发
cd server
npm install     # 安装后端依赖
npm run dev     # 启动开发服务器 (localhost:3001)
```

## 架构

### 内容结构
- `docs/` - 文档（按项目/主题分文件夹，自动生成侧边栏）
- `blog/` - 博客（按 `YYYY-MM-DD-title/index.md` 格式组织）

### 关键配置
- `docusaurus.config.js` - 站点配置、导航栏、主题、搜索插件
- `sidebars.js` - 文档侧边栏（使用 autogenerated 自动从 docs/ 生成）

### 自定义组件
- `src/theme/Root.js` - 全局包装器，注入 AI 聊天组件
- `src/components/AIChatWidget/` - AI 聊天悬浮窗，使用 Vercel AI SDK

### API 后端
- `server/index.js` - Express 入口，监听 :3001
- `server/routes/chat.js` - AI 聊天路由，SSE 流式响应
- `server/.env` - 环境变量（API 密钥等，不提交）

### 搜索
使用 `@easyops-cn/docusaurus-search-local` 本地搜索插件，支持中英文。

## 部署

推送到 main 分支自动触发 GitHub Actions 部署到阿里云服务器。

**GitHub Secrets 配置:**
- `SSH_PRIVATE_KEY` - 服务器 SSH 私钥
- `REMOTE_HOST` - 服务器公网 IP
- `REMOTE_USER` - SSH 用户名

**服务器结构:**
- `/var/www/blog` - 静态站（自动部署）
- `/var/www/blog-api` - API 服务（PM2 管理）

## 添加内容

### 文档
在 `docs/` 下创建文件夹和 Markdown 文件。使用 frontmatter 设置标题和标签：

```markdown
---
title: 文章标题
tags: [标签1, 标签2]
sidebar_position: 1
---
```

### 博客
在 `blog/` 下创建 `YYYY-MM-DD-title/index.md`。
```

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with server architecture"
```

---

## Task 9: 本地验证

**Files:** 无新建文件

- [ ] **Step 1: 安装后端依赖**

```powershell
cd server; npm install; cd ..
```

- [ ] **Step 2: 创建本地 .env 文件**

复制 `server/.env.example` 为 `server/.env`，填入实际 API 密钥：

```powershell
Copy-Item server/.env.example server/.env
```

编辑 `server/.env`，设置 `AI_API_KEY`。

- [ ] **Step 3: 启动后端服务**

```powershell
cd server; npm run dev
```

Expected: `API server running on port 3001`

- [ ] **Step 4: 测试健康检查**

新开终端窗口：

```powershell
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 5: 启动前端**

```powershell
npm run start
```

- [ ] **Step 6: 浏览器测试 AI 聊天**

打开 http://localhost:3000，点击右下角聊天按钮，发送消息，验证 AI 回复正常。

---

## 服务器部署检查清单（手动）

完成代码实施后，按以下步骤在阿里云服务器上部署：

- [ ] 购买阿里云轻量应用服务器（2核2G，Ubuntu 22.04）
- [ ] 购买域名并配置 A 记录指向服务器 IP
- [ ] SSH 登录服务器，执行 `deploy/setup-server.sh`
- [ ] 配置 Nginx（复制 `deploy/nginx.conf`，替换域名）
- [ ] 申请 SSL 证书：`certbot --nginx -d your-domain.com`
- [ ] 上传 `server/` 代码到 `/var/www/blog-api`
- [ ] 创建 `/var/www/blog-api/.env` 并配置 API 密钥
- [ ] 启动 API：`cd /var/www/blog-api && npm install && pm2 start ecosystem.config.cjs && pm2 save`
- [ ] 配置 GitHub Secrets（SSH_PRIVATE_KEY, REMOTE_HOST, REMOTE_USER）
- [ ] 推送代码触发自动部署
- [ ] 访问域名验证博客和 AI 聊天功能
