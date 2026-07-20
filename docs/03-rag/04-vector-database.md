---
title: 向量数据库
sidebar_position: 4
tags: [RAG, 向量数据库, Chroma, Milvus, PgVector]
---

# 向量数据库

> Chroma、Milvus、Weaviate、PgVector 选型与使用

## 概述

向量数据库专门用于存储和检索向量数据，是 RAG 系统的核心组件。

## 核心概念

### 1. 为什么需要向量数据库

```
普通数据库：
SELECT * FROM documents WHERE content LIKE '%天气%'  -- 关键词匹配

向量数据库：
找出与 "北京今天温度多少" 语义最相似的文档  -- 语义匹配
```

### 2. 主流产品对比

| 产品 | 类型 | 适用场景 | 复杂度 |
|------|------|----------|--------|
| Chroma | 嵌入式 | 开发/小规模 | 低 |
| FAISS | 库 | 本地/研究 | 低 |
| Milvus | 分布式 | 生产/大规模 | 高 |
| Weaviate | 云原生 | 生产 | 中 |
| PgVector | PostgreSQL 扩展 | 已有 PG | 中 |
| Pinecone | 云服务 | 快速上手 | 低 |

### 3. 核心操作

```
1. 创建集合（Collection）
2. 插入向量 + 元数据
3. 相似度搜索（ANN）
4. 过滤 + 搜索
```

## 实践要点

### Chroma（开发首选）

{/* TODO: 补充持久化配置 */}

```python
import chromadb
from chromadb.config import Settings

# 内存模式
client = chromadb.Client()

# 持久化模式
client = chromadb.PersistentClient(path="./chroma_db")

# 创建集合
collection = client.create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 插入数据
collection.add(
    ids=["doc1", "doc2"],
    documents=["文档内容1", "文档内容2"],
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],  # 可选，会自动生成
    metadatas=[{"source": "file1"}, {"source": "file2"}]
)

# 查询
results = collection.query(
    query_texts=["查询内容"],  # 或 query_embeddings
    n_results=5,
    where={"source": "file1"}  # 元数据过滤
)
```

### LangChain 集成

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    collection_name="my_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# 添加文档
from langchain.schema import Document

docs = [
    Document(page_content="内容1", metadata={"source": "file1"}),
    Document(page_content="内容2", metadata={"source": "file2"}),
]
vectorstore.add_documents(docs)

# 检索
results = vectorstore.similarity_search("查询", k=5)
# 或带分数
results = vectorstore.similarity_search_with_score("查询", k=5)
```

### PgVector（PostgreSQL 扩展）

```python
# 安装: pip install pgvector

from langchain_postgres import PGVector

connection_string = "postgresql://user:pass@localhost:5432/mydb"

vectorstore = PGVector(
    connection=connection_string,
    collection_name="documents",
    embeddings=embeddings,
)

# 使用方式与 Chroma 类似
vectorstore.add_documents(docs)
results = vectorstore.similarity_search("查询", k=5)
```

### Milvus（生产环境）

```python
from langchain_milvus import Milvus

vectorstore = Milvus(
    embedding_function=embeddings,
    connection_args={"host": "localhost", "port": 19530},
    collection_name="documents",
)

# 批量插入
vectorstore.add_documents(docs)

# 检索
results = vectorstore.similarity_search("查询", k=5)
```

### 选型建议

```
开发/原型阶段
└── Chroma（零配置，内存模式即可开始）

小规模生产（少于 100 万向量）
├── 已有 PostgreSQL → PgVector
├── 需要云服务 → Pinecone
└── 本地部署 → Chroma 持久化

大规模生产（超过 100 万向量）
├── 自建 → Milvus
└── 云服务 → Pinecone / Weaviate Cloud
```

## 常见问题

### Q: 向量数据库和传统数据库能结合吗？

可以。常见模式：
1. PgVector：在 PostgreSQL 中添加向量能力
2. 混合架构：向量库存向量 + 传统库存元数据

### Q: 需要多少内存？

粗略估算：100 万 x 1536 维 x 4 字节 ≈ 6GB
实际还需要索引空间，通常是原数据的 1.5-2 倍

### Q: 如何处理数据更新？

```python
# 删除后重新插入
vectorstore.delete(ids=["doc1"])
vectorstore.add_documents([updated_doc])

# 或使用 upsert（如果支持）
```

## 学习资源

- [Chroma 文档](https://docs.trychroma.com/)
- [Milvus 文档](https://milvus.io/docs)
- [PgVector](https://github.com/pgvector/pgvector)

---

{/* TODO: 补充生产环境部署配置 */}
