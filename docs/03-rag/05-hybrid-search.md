---
title: 混合检索（语义 + 关键词）
sidebar_position: 5
tags: [RAG, 混合检索, BM25, 语义搜索]
---

# 混合检索

> 结合语义搜索和关键词搜索，提升检索效果

## 概述

单纯的语义搜索可能错过包含关键词但表述不同的内容；单纯的关键词搜索可能错过语义相关但词汇不同的内容。混合检索结合两者的优势。

## 核心概念

### 1. 两种检索方式

```
语义检索（Dense Retrieval）：
- 基于 Embedding 相似度
- 理解"意思相近"
- 例：查询"汽车" 能匹配 "轿车"、"车辆"

关键词检索（Sparse Retrieval）：
- 基于词频统计（如 BM25）
- 精确匹配关键词
- 例：查询"Model-3" 精确匹配产品名
```

### 2. 为什么需要混合

| 场景 | 语义检索 | 关键词检索 | 混合 |
|------|----------|------------|------|
| 同义词查询 | ✅ | ❌ | ✅ |
| 专有名词 | ❌ | ✅ | ✅ |
| 缩写/代号 | ❌ | ✅ | ✅ |
| 模糊表达 | ✅ | ❌ | ✅ |

### 3. 融合策略

```python
# 方式 1: 加权求和
final_score = alpha * semantic_score + (1 - alpha) * keyword_score

# 方式 2: RRF (Reciprocal Rank Fusion)
# 更稳定，不需要调权重
rrf_score = sum(1 / (k + rank_i) for rank_i in rankings)
```

## 实践要点

### BM25 实现

{/* TODO: 补充完整的混合检索代码 */}

```python
from rank_bm25 import BM25Okapi
import jieba

class BM25Retriever:
    def __init__(self, documents: list[str]):
        # 中文分词
        self.tokenized = [list(jieba.cut(doc)) for doc in documents]
        self.bm25 = BM25Okapi(self.tokenized)
        self.documents = documents
    
    def search(self, query: str, k: int = 5) -> list[tuple[str, float]]:
        query_tokens = list(jieba.cut(query))
        scores = self.bm25.get_scores(query_tokens)
        
        # 取 top-k
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        return [(self.documents[i], scores[i]) for i in top_indices]
```

### 混合检索实现

```python
class HybridRetriever:
    def __init__(self, vectorstore, bm25_retriever, alpha: float = 0.5):
        self.vectorstore = vectorstore
        self.bm25 = bm25_retriever
        self.alpha = alpha
    
    def search(self, query: str, k: int = 5) -> list[str]:
        # 语义检索
        semantic_results = self.vectorstore.similarity_search_with_score(query, k=k*2)
        
        # 关键词检索
        bm25_results = self.bm25.search(query, k=k*2)
        
        # 融合（RRF）
        scores = {}
        K = 60  # RRF 参数
        
        for rank, (doc, _) in enumerate(semantic_results):
            doc_id = doc.page_content
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (K + rank + 1)
        
        for rank, (doc_content, _) in enumerate(bm25_results):
            scores[doc_content] = scores.get(doc_content, 0) + 1 / (K + rank + 1)
        
        # 排序返回
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in sorted_docs[:k]]
```

### LangChain EnsembleRetriever

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_chroma import Chroma

# 创建两个检索器
bm25_retriever = BM25Retriever.from_documents(documents)
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 组合
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6]  # 权重分配
)

# 使用
results = ensemble_retriever.invoke("查询内容")
```

### 权重调优

```python
def evaluate_hybrid(queries, ground_truth, alpha_range):
    """评估不同权重的效果"""
    results = []
    
    for alpha in alpha_range:
        retriever = HybridRetriever(vectorstore, bm25, alpha=alpha)
        
        # 计算指标（如 Recall@K, MRR）
        recall = compute_recall(retriever, queries, ground_truth)
        results.append({"alpha": alpha, "recall": recall})
    
    return results

# 测试
results = evaluate_hybrid(test_queries, labels, [0.3, 0.5, 0.7])
```

## 常见问题

### Q: alpha 权重怎么设？

- 默认 0.5（平衡）
- 专有名词多：增大关键词权重（alpha 调小）
- 自然语言表达多：增大语义权重（alpha 调大）
- 最佳实践：用测试集调优

### Q: RRF 和加权求和哪个好？

RRF 更稳定，不需要归一化分数，推荐作为默认选择。

### Q: 混合检索更慢吗？

是的，需要执行两次检索。但通常影响不大（毫秒级）。可以并行执行。

## 学习资源

- [Hybrid Search 介绍](https://www.pinecone.io/learn/hybrid-search-intro/)
- [rank_bm25 库](https://github.com/dorianbrown/rank_bm25)

---

{/* TODO: 补充实际项目的混合检索效果对比 */}
