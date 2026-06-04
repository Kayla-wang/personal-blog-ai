---
title: Docker 容器化
sidebar_position: 2
tags: [Docker, 容器化, 部署]
---

# Docker 容器化

> AI 应用的容器化部署

## 概述

Docker 让 AI 应用的部署变得标准化、可重复。无论本地开发还是云端部署，环境一致。

## 核心概念

### 1. 为什么用 Docker

```
问题：
- "在我机器上能跑"
- Python 版本冲突
- 依赖安装困难

解决：
- 环境完全一致
- 依赖打包在镜像中
- 一键启动
```

### 2. AI 应用镜像要点

- Python 版本匹配
- 大型依赖（torch）的处理
- 环境变量管理
- 多阶段构建减小体积

## 实践要点

### 基础 Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 多阶段构建（减小体积）

{/* TODO: 补充更复杂的多阶段构建 */}

```dockerfile
# 构建阶段
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --target=/app/deps -r requirements.txt

# 运行阶段
FROM python:3.11-slim

WORKDIR /app

# 只复制依赖
COPY --from=builder /app/deps /usr/local/lib/python3.11/site-packages

# 复制代码
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
      - redis
    volumes:
      - ./data:/app/data

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  postgres_data:
  chroma_data:
```

### 环境变量管理

```dockerfile
# Dockerfile
# 不要硬编码敏感信息！
ENV PYTHONUNBUFFERED=1
# API Key 通过运行时传入
```

```bash
# 运行时传入
docker run -e OPENAI_API_KEY=sk-xxx my-app

# 或使用 .env 文件
docker run --env-file .env my-app
```

### GPU 支持

```dockerfile
# 使用 NVIDIA CUDA 基础镜像
FROM nvidia/cuda:12.1-runtime-ubuntu22.04

# 安装 Python
RUN apt-get update && apt-get install -y python3.11 python3-pip

# 安装 PyTorch (GPU 版本)
RUN pip install torch --index-url https://download.pytorch.org/whl/cu121

# 其他依赖...
```

```yaml
# docker-compose.yml (GPU)
services:
  gpu-app:
    build: .
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 常用命令

```bash
# 构建镜像
docker build -t my-ai-app .

# 运行容器
docker run -d -p 8000:8000 --name ai-api my-ai-app

# 查看日志
docker logs -f ai-api

# 进入容器调试
docker exec -it ai-api bash

# 使用 compose
docker compose up -d
docker compose logs -f
docker compose down
```

## 常见问题

### Q: 镜像太大怎么办？

1. 使用 slim/alpine 基础镜像
2. 多阶段构建
3. 清理缓存：`pip install --no-cache-dir`
4. 使用 `.dockerignore` 排除不需要的文件

```
# .dockerignore
.git
__pycache__
*.pyc
.env
.venv
tests
```

### Q: 如何处理大模型文件？

1. 不打包进镜像，运行时下载
2. 使用外部存储（S3/OSS）
3. 挂载 volume

```python
# 运行时下载模型
from huggingface_hub import snapshot_download

model_path = snapshot_download("BAAI/bge-m3", cache_dir="/app/models")
```

### Q: 本地开发时热重载？

```yaml
services:
  api:
    volumes:
      - .:/app  # 挂载代码目录
    command: uvicorn main:app --reload --host 0.0.0.0
```

## 学习资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

---

{/* TODO: 补充生产级 Docker 配置 */}
