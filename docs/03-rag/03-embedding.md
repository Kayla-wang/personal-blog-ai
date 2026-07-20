---
title: Embedding 模型
sidebar_position: 3
tags: [RAG, Embedding, 向量, BGE]
---

# Embedding 模型

> 将文本转换为向量，实现语义搜索

## 概述

Embedding 将文本映射到高维向量空间，语义相似的文本在空间中距离更近。这是 RAG 语义搜索的基础。

## 核心概念

### 1. 什么是 Embedding

```
"今天天气很好" → [0.12, -0.45, 0.78, ...] (1536 维向量)
"天气晴朗"    → [0.11, -0.43, 0.76, ...]  (相似，距离近)
"我喜欢编程"  → [0.89, 0.23, -0.56, ...]  (不相似，距离远)
```

### 2. 主流 Embedding 模型

| 模型 | 厂商 | 维度 | 最大长度 | 中文支持 |
|------|------|------|----------|----------|
| text-embedding-3-small | OpenAI | 1536 | 8191 | 良好 |
| text-embedding-3-large | OpenAI | 3072 | 8191 | 良好 |
| BGE-M3 | BAAI | 1024 | 8192 | 优秀 |
| text-embedding-v3 | 阿里 | 1024 | 8192 | 优秀 |

### 3. 使用方式

```python
# OpenAI
from openai import OpenAI

client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="要嵌入的文本"
)

embedding = response.data[0].embedding  # 1536 维向量
```

## 实践要点

### LangChain 封装

{/* TODO: 补充不同 Embedding 的对比测试 */}

```python
# OpenAI
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector = embeddings.embed_query("查询文本")
vectors = embeddings.embed_documents(["文档1", "文档2"])

# 阿里通义
from langchain_community.embeddings import DashScopeEmbeddings

embeddings = DashScopeEmbeddings(model="text-embedding-v3")

# 本地模型（BGE）
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

embeddings = HuggingFaceBgeEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={"device": "cuda"}  # 或 "cpu"
)
```

### 批量处理

```python
async def batch_embed(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """批量生成 Embedding"""
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        embeddings = await embeddings_model.aembed_documents(batch)
        all_embeddings.extend(embeddings)
    
    return all_embeddings
```

### 相似度计算

```python
import numpy as np

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """计算余弦相似度"""
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

# 使用
query_embedding = embeddings.embed_query("北京天气")
doc_embedding = embeddings.embed_query("今天北京晴天")
similarity = cosine_similarity(query_embedding, doc_embedding)
print(f"相似度: {similarity:.4f}")  # 约 0.85+
```

### 模型选择建议

```
场景分析：
├── 成本敏感 + 质量要求一般
│   └── text-embedding-3-small（OpenAI，便宜）
│
├── 高质量需求
│   └── text-embedding-3-large（OpenAI）
│
├── 中文为主 + 国内部署
│   └── text-embedding-v3（阿里）
│
├── 离线部署 / 隐私要求
│   └── BGE-M3（本地运行）
│
└── 多语言场景
    └── BGE-M3（多语言支持最好）
```

### 本地部署 BGE

```python
# 安装
# pip install sentence-transformers

from sentence_transformers import SentenceTransformer

# 加载模型（首次会下载）
model = SentenceTransformer('BAAI/bge-m3')

# 生成 Embedding
texts = ["文本1", "文本2"]
embeddings = model.encode(texts)

# 查询时添加 instruction（BGE 特性）
query = "搜索内容"
query_embedding = model.encode(f"为这个句子生成表示: {query}")
```

## 常见问题

### Q: 不同模型的 Embedding 可以混用吗？

**不可以**。不同模型生成的向量空间不同，相似度计算没有意义。

### Q: 文本超过最大长度怎么办？

1. 截断（简单但可能丢信息）
2. 分块后分别 Embedding
3. 取多块的平均向量

### Q: 如何评估 Embedding 效果？

1. 准备测试集（相似和不相似的文本对）
2. 计算相似度分布
3. 检查相似文本的相似度是否高于不相似的

```python
def evaluate_embeddings(model, similar_pairs, dissimilar_pairs):
    similar_scores = []
    for text1, text2 in similar_pairs:
        emb1 = model.embed_query(text1)
        emb2 = model.embed_query(text2)
        similar_scores.append(cosine_similarity(emb1, emb2))
    
    # 类似处理 dissimilar_pairs...
    
    print(f"相似对平均分: {np.mean(similar_scores):.3f}")
```

## 学习资源

- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [BGE 模型](https://huggingface.co/BAAI/bge-m3)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

---

{/* TODO: 补充 Embedding 模型对比实验 */}
