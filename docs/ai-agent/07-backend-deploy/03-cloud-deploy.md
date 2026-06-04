---
title: 云服务部署
sidebar_position: 3
tags: [部署, 阿里云, 腾讯云, AWS]
---

# 云服务部署

> 阿里云、腾讯云、AWS 部署指南

## 概述

AI 应用通常部署在云服务器上。本文介绍主流云平台的部署方式。

## 核心概念

### 1. 部署选项

| 方式 | 适用场景 | 复杂度 | 成本 |
|------|----------|--------|------|
| 云服务器（ECS） | 通用 | 中 | 中 |
| 容器服务（K8s） | 大规模 | 高 | 高 |
| Serverless | 低流量 | 低 | 低 |
| PaaS 平台 | 快速部署 | 低 | 中 |

### 2. AI 应用特殊需求

```
- GPU 实例（本地模型）
- 大内存（向量数据库）
- 低延迟网络（API 调用）
- 持久化存储（数据/模型）
```

## 实践要点

### 阿里云 ECS 部署

{/* TODO: 补充详细的阿里云部署脚本 */}

```bash
# 1. 购买 ECS 实例
# 推荐配置：2核4G 起步，按需升级

# 2. 登录服务器
ssh root@your-server-ip

# 3. 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 4. 部署应用
docker pull your-registry/your-app:latest
docker run -d \
  --name ai-api \
  -p 80:8000 \
  -e OPENAI_API_KEY=sk-xxx \
  --restart unless-stopped \
  your-registry/your-app:latest

# 5. 配置 Nginx（可选）
apt install nginx
# 配置反向代理...
```

### 使用 PM2 部署（非 Docker）

```bash
# 安装 PM2
npm install -g pm2

# 安装 Python 依赖
pip install -r requirements.txt

# 使用 PM2 启动
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name ai-api

# 设置开机启动
pm2 startup
pm2 save

# 查看日志
pm2 logs ai-api
```

### Nginx 反向代理

```nginx
# /etc/nginx/sites-available/ai-api
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### SSL 证书配置

```bash
# 使用 Certbot 自动获取证书
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### GitHub Actions 自动部署

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/ai-api
            git pull
            pip install -r requirements.txt
            pm2 restart ai-api
```

### 腾讯云部署

```bash
# 腾讯云 CVM 部署流程与阿里云类似
# 特色服务：
# - 云函数 SCF（Serverless）
# - 容器服务 TKE
# - 轻量应用服务器（入门推荐）
```

### AWS 部署

```bash
# AWS EC2
# 1. 启动 EC2 实例
# 2. 配置安全组（开放端口）
# 3. SSH 连接部署

# AWS App Runner（简化部署）
# 直接从 Docker 镜像或 GitHub 部署
```

## 常见问题

### Q: 如何选择云服务商？

| 考虑因素 | 阿里云 | 腾讯云 | AWS |
|----------|--------|--------|-----|
| 国内访问 | 最优 | 优 | 需备案 |
| 价格 | 中 | 中 | 较高 |
| 文档 | 中文 | 中文 | 英文为主 |
| 生态 | 国内丰富 | 国内丰富 | 全球最全 |

### Q: 需要多大的服务器？

| 场景 | 推荐配置 |
|------|----------|
| 简单 API 代理 | 1核2G |
| RAG 应用 | 2核4G |
| 本地向量库 | 4核8G |
| 本地模型推理 | GPU 实例 |

### Q: 如何监控服务状态？

```bash
# 简单监控
pm2 monit

# 云平台监控
# - 阿里云：云监控
# - 腾讯云：云监控
# - 通用：Prometheus + Grafana
```

## 学习资源

- [阿里云 ECS 文档](https://help.aliyun.com/product/25365.html)
- [腾讯云 CVM 文档](https://cloud.tencent.com/document/product/213)

---

{/* TODO: 补充完整的生产部署清单 */}
