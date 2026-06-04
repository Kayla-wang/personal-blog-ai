---
title: 基础数据库（PostgreSQL / Redis）
sidebar_position: 5
tags: [PostgreSQL, Redis, 数据库]
---

# 基础数据库

> AI 应用的数据存储方案

## 概述

AI 应用需要存储对话历史、用户数据、缓存等。PostgreSQL 和 Redis 是最常用的组合。

## 核心概念

### 1. 数据库选型

| 需求 | 推荐方案 |
|------|----------|
| 结构化数据 | PostgreSQL |
| 缓存 | Redis |
| 向量存储 | PostgreSQL + pgvector |
| 会话状态 | Redis |
| 消息队列 | Redis |

### 2. AI 应用常见存储

```
PostgreSQL:
├── 用户表
├── 对话历史
├── 文档/知识库
└── 向量数据（pgvector）

Redis:
├── 会话缓存
├── API 响应缓存
├── 限流计数
└── 任务队列
```

## 实践要点

### PostgreSQL 基础

```python
# 使用 SQLAlchemy
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

# 模型定义
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), index=True)
    role = Column(String(20))  # user/assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# 连接数据库
engine = create_engine("postgresql://user:pass@localhost/mydb")
Session = sessionmaker(bind=engine)

# 使用
def save_message(user_id: str, role: str, content: str):
    session = Session()
    message = Conversation(user_id=user_id, role=role, content=content)
    session.add(message)
    session.commit()
    session.close()

def get_history(user_id: str, limit: int = 10):
    session = Session()
    messages = session.query(Conversation)\
        .filter_by(user_id=user_id)\
        .order_by(Conversation.created_at.desc())\
        .limit(limit)\
        .all()
    session.close()
    return messages
```

### pgvector 向量存储

{/* TODO: 补充完整的 pgvector 使用示例 */}

```sql
-- 安装扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建表
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536),  -- OpenAI embedding 维度
    metadata JSONB
);

-- 创建索引（加速相似度搜索）
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

```python
# Python 使用
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, Text

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True)
    content = Column(Text)
    embedding = Column(Vector(1536))

# 相似度搜索
def search_similar(query_embedding: list[float], limit: int = 5):
    session = Session()
    results = session.query(Document)\
        .order_by(Document.embedding.cosine_distance(query_embedding))\
        .limit(limit)\
        .all()
    return results
```

### Redis 缓存

```python
import redis
import json
from typing import Optional

r = redis.Redis(host='localhost', port=6379, db=0)

# 缓存 API 响应
def get_cached_response(key: str) -> Optional[str]:
    cached = r.get(key)
    if cached:
        return cached.decode()
    return None

def cache_response(key: str, response: str, ttl: int = 3600):
    r.setex(key, ttl, response)

# 使用示例
async def chat_with_cache(message: str):
    cache_key = f"chat:{hash(message)}"
    
    # 检查缓存
    cached = get_cached_response(cache_key)
    if cached:
        return cached
    
    # 调用 LLM
    response = await call_llm(message)
    
    # 缓存结果
    cache_response(cache_key, response, ttl=1800)  # 30 分钟
    
    return response
```

### Redis 会话管理

```python
# 存储会话状态
def save_session(session_id: str, data: dict, ttl: int = 86400):
    r.setex(f"session:{session_id}", ttl, json.dumps(data))

def get_session(session_id: str) -> Optional[dict]:
    data = r.get(f"session:{session_id}")
    if data:
        return json.loads(data)
    return None

def update_session(session_id: str, updates: dict):
    session = get_session(session_id) or {}
    session.update(updates)
    save_session(session_id, session)
```

### Redis 限流

```python
def is_rate_limited(user_id: str, limit: int = 10, window: int = 60) -> bool:
    """检查是否超出限流"""
    key = f"ratelimit:{user_id}"
    
    current = r.incr(key)
    if current == 1:
        r.expire(key, window)
    
    return current > limit
```

### FastAPI 集成

```python
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

# 数据库依赖
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/chat")
async def chat(message: str, user_id: str, db: Session = Depends(get_db)):
    # 限流检查
    if is_rate_limited(user_id):
        raise HTTPException(429, "请求过于频繁")
    
    # 获取历史
    history = get_history(user_id, db)
    
    # 调用 LLM
    response = await call_llm_with_history(message, history)
    
    # 保存消息
    save_message(user_id, "user", message, db)
    save_message(user_id, "assistant", response, db)
    
    return {"reply": response}
```

## 常见问题

### Q: PostgreSQL 和 MongoDB 怎么选？

| 场景 | 推荐 |
|------|------|
| 结构化数据为主 | PostgreSQL |
| 需要向量搜索 | PostgreSQL + pgvector |
| 文档型数据多 | MongoDB |
| 已有技术栈 | 跟随团队选择 |

### Q: Redis 需要持久化吗？

- 缓存数据：不需要，丢失可重建
- 会话数据：建议开启 AOF
- 任务队列：建议开启持久化

### Q: 向量数据库和 pgvector 怎么选？

| 场景 | 推荐 |
|------|------|
| < 100 万向量 | pgvector（够用） |
| > 100 万向量 | Milvus/Pinecone |
| 已有 PostgreSQL | pgvector（方便） |

## 学习资源

- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/docs/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)

---

{/* TODO: 补充数据库优化和监控 */}
