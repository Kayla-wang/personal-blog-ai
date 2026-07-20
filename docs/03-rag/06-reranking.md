---
title: Reranking（重排序）
sidebar_position: 6
tags: [RAG, Reranking, 重排序]
---

# Reranking（重排序）

> 用更精准的模型对检索结果重新排序

## 概述

初步检索（recall）返回 top-k 候选后，用更精确（但更慢）的模型重新打分排序，提升最终结果质量。

## 核心概念

### 1. 为什么需要 Reranking

```
检索流程：
1. 粗排（Retrieval）：快速召回 100 个候选
2. 精排（Reranking）：精确评估 100 → 选出最佳 10 个

类比搜索引擎：
- 粗排：倒排索引快速匹配
- 精排：复杂模型精确评分
```

### 2. Reranking 模型

| 模型 | 类型 | 优势 | 延迟 |
|------|------|------|------|
| Cohere Rerank | API | 效果好、易用 | 中 |
| BGE-Reranker | 本地 | 免费、中文好 | 中 |
| Cross-Encoder | 本地 | 灵活 | 高 |
| LLM Rerank | LLM | 无需额外模型 | 高 |

### 3. 工作原理

```python
# Bi-Encoder (Embedding)：独立编码 query 和 doc，计算相似度
query_emb = encode(query)
doc_emb = encode(document)
score = cosine_similarity(query_emb, doc_emb)

# Cross-Encoder (Reranking)：联合编码 query 和 doc
score = model(query + " [SEP] " + document)  # 更精确但更慢
```

## 实践要点

### Cohere Rerank

{/* TODO: 补充 Cohere Rerank 实际使用代码 */}

```python
import cohere

co = cohere.Client("your-api-key")

# 重排序
results = co.rerank(
    model="rerank-multilingual-v3.0",  # 支持中文
    query="什么是 RAG？",
    documents=[
        "RAG 是检索增强生成的缩写...",
        "机器学习是一种...",
        "RAG 结合了检索和生成...",
    ],
    top_n=3
)

for result in results.results:
    print(f"Score: {result.relevance_score:.3f}, Index: {result.index}")
```

### BGE-Reranker（本地部署）

```python
from sentence_transformers import CrossEncoder

# 加载模型
reranker = CrossEncoder('BAAI/bge-reranker-v2-m3')

# 计算分数
query = "什么是 RAG？"
documents = ["RAG 是...", "机器学习是...", "检索增强生成..."]

pairs = [[query, doc] for doc in documents]
scores = reranker.predict(pairs)

# 排序
ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

### LangChain 集成

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

# 基础检索器
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# Reranker
reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=5)

# 组合
compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=base_retriever
)

# 使用
results = compression_retriever.invoke("查询内容")
```

### 用 LLM 做 Reranking

```python
async def llm_rerank(query: str, documents: list[str], top_n: int = 5) -> list[str]:
    """用 LLM 评估相关性"""
    
    prompt = f"""
    查询：{query}
    
    请评估以下文档与查询的相关性（1-10分），输出 JSON 格式：
    
    {chr(10).join(f'{i+1}. {doc[:200]}...' for i, doc in enumerate(documents))}
    
    输出格式：
    {{"scores": [分数1, 分数2, ...]}}
    """
    
    response = await llm.invoke(prompt)
    scores = json.loads(response.content)["scores"]
    
    # 排序返回
    ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in ranked[:top_n]]
```

### 完整 RAG Pipeline

```python
class RAGPipeline:
    def __init__(self, vectorstore, reranker, llm):
        self.vectorstore = vectorstore
        self.reranker = reranker
        self.llm = llm
    
    async def query(self, question: str) -> str:
        # 1. 粗排：检索 top-20
        candidates = self.vectorstore.similarity_search(question, k=20)
        
        # 2. 精排：重排序取 top-5
        docs_text = [doc.page_content for doc in candidates]
        reranked = self.reranker.rerank(question, docs_text, top_n=5)
        
        # 3. 生成答案
        context = "\n\n".join(reranked)
        prompt = f"基于以下内容回答问题：\n{context}\n\n问题：{question}"
        answer = await self.llm.ainvoke(prompt)
        
        return answer.content
```

## 常见问题

### Q: Reranking 会增加多少延迟？

- Cohere API：~200-500ms
- BGE 本地（GPU）：~50-200ms
- LLM Rerank：~1-3s

通常可接受，因为只处理 top-k 候选。

### Q: 粗排取多少候选合适？

- 一般：粗排 20-50 → 精排 5-10
- 精排能力越强，可以粗排更多

### Q: 不做 Reranking 可以吗？

简单场景可以。但如果检索质量影响最终效果，建议加上 Reranking。

## 学习资源

- [Cohere Rerank](https://docs.cohere.com/reference/rerank)
- [BGE Reranker](https://huggingface.co/BAAI/bge-reranker-v2-m3)

---

{/* TODO: 补充 Reranking 前后效果对比实验 */}
