# 阿里云轻量服务器部署设计

## 概述

将学习笔记博客从 GitHub Pages（原计划）迁移到阿里云轻量应用服务器，支持静态博客托管和 AI 聊天后端 API。

## 需求

- 部署 Docusaurus 静态博客到可公开访问的地址
- 保留 AI 聊天功能，支持后端 API
- 预留未来扩展其他 AI 能力的空间
- 自动化部署流程

## 资源清单

| 资源 | 规格 | 费用 | 备注 |
|-----|------|------|------|
| 轻量应用服务器 | 2核2G，60G SSD | ~60元/月 | 系统镜像 Ubuntu 22.04 |
| 域名 | .com / .cn | 50-70元/年 | 阿里云万网购买 |
| SSL 证书 | DV 证书 | 免费 | 阿里云免费证书或 Let's Encrypt |

**地域：** 华东1（杭州）或华东2（上海）

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    轻量应用服务器                         │
│                                                         │
│  ┌─────────────┐      ┌─────────────────────────────┐  │
│  │   Nginx     │      │      Node.js API            │  │
│  │   :80/:443  │─────▶│      :3001 (PM2)            │  │
│  │             │      │                             │  │
│  │  静态文件    │      │  /api/chat → AI 服务        │  │
│  │  /var/www/  │      │  (未来扩展其他 AI 能力)       │  │
│  └─────────────┘      └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   用户浏览器     │
│   your-domain   │
└─────────────────┘
```

**请求路由：**
- `/*` → Nginx 返回静态文件
- `/api/*` → Nginx 反向代理到 Node.js :3001

## 项目结构变更

新增 `server/` 目录：

```
docs/
├── server/                   # 新增：API 后端
│   ├── index.js              # Express 入口
│   ├── routes/
│   │   └── chat.js           # /api/chat 路由
│   ├── package.json          # 后端依赖
│   └── .env.example          # 环境变量模板
├── docs/                     # 文档内容
├── blog/                     # 博客内容
├── src/                      # 前端源码
└── ...
```

## AI API 设计

**端点：** `POST /api/chat`

**请求：**
```json
{
  "messages": [
    {"role": "user", "content": "你好"}
  ]
}
```

**响应：** SSE 流式返回

**技术栈：**
- Express.js
- Vercel AI SDK（服务端）
- 支持多 AI 提供商（OpenAI / 通义 / DeepSeek）

**环境变量：**
```
AI_PROVIDER=openai
AI_API_KEY=sk-xxx
AI_MODEL=gpt-3.5-turbo
```

## 服务器配置

### 目录结构

```
/var/www/
├── blog/           # Docusaurus 静态文件（GitHub Actions 部署）
└── blog-api/       # Node.js API 服务（手动或 Actions 部署）
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'blog-api',
    script: './index.js',
    cwd: '/var/www/blog-api',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

## CI/CD 流程

复用现有 GitHub Actions，更新 Secrets：

| Secret | 说明 |
|--------|------|
| SSH_PRIVATE_KEY | 阿里云服务器 SSH 私钥 |
| REMOTE_HOST | 服务器公网 IP |
| REMOTE_USER | SSH 用户名（通常 root） |

静态站自动部署到 `/var/www/blog`，API 服务首次手动部署后由 PM2 管理。

## 域名与备案

1. 阿里云万网购买域名
2. 添加 A 记录指向服务器 IP
3. 如使用 .cn 域名，需完成 ICP 备案（约 7-20 个工作日）
4. 申请 SSL 证书并配置 HTTPS

## 后续扩展

`server/routes/` 目录结构支持添加更多 AI 能力：

```
server/routes/
├── chat.js           # 对话
├── summary.js        # 摘要（未来）
├── translate.js      # 翻译（未来）
└── ...
```
