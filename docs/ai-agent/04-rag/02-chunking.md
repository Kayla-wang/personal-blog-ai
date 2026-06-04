---
title: 文档切分策略
sidebar_position: 2
tags: [RAG, 切分, Chunking]
---

# 文档切分策略

> 如何将长文档切分为合适的片段

## 概述

切分（Chunking）是 RAG 的关键步骤。切分策略直接影响检索质量：太大会丢失精度，太小会丢失上下文。

## 核心概念

### 1. 为什么需要切分

```
问题：
- LLM 上下文窗口有限
- Embedding 模型有最大长度限制
- 检索需要精确匹配片段

解决：
- 将长文档切分为小块
- 每块独立 Embedding
- 检索时返回最相关的块
```

### 2. 常见切分策略

| 策略 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| 固定长度 | 通用 | 简单 | 可能切断句子 |
| 按句子/段落 | 文章 | 保持语义完整 | 长度不均匀 |
| 递归切分 | 通用 | 智能、灵活 | 稍复杂 |
| 语义切分 | 高质量需求 | 最佳效果 | 需要额外模型 |

### 3. 关键参数

```python
chunk_size = 500      # 每块的目标大小（字符数或 Token 数）
chunk_overlap = 50    # 块之间的重叠（保持上下文连贯）
```

## 实践要点

### 固定长度切分

```python
def fixed_size_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """固定长度切分"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap  # 重叠
    
    return chunks
```

### 递归切分（推荐）

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 最常用的切分器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", ".", " ", ""]  # 按优先级尝试分隔符
)

chunks = splitter.split_text(long_text)

# 中文优化版本
chinese_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""]
)
```

### 按语义切分

{/* TODO: 补充语义切分的实际代码 */}

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

# 基于 Embedding 相似度切分
embeddings = OpenAIEmbeddings()
semantic_splitter = SemanticChunker(embeddings)

chunks = semantic_splitter.split_text(long_text)
```

### 代码专用切分

```python
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter

# Python 代码切分
python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100
)

# 会保持函数/类的完整性
chunks = python_splitter.split_text(python_code)
```

### Chunk 大小选择

```
经验法则：
- 问答场景：300-500 字符
- 长文档摘要：1000-2000 字符
- 代码：按函数/类切分

影响因素：
- Embedding 模型最大长度（如 8192 tokens）
- 检索精度需求
- LLM 上下文窗口
```

### 添加元数据

```python
from langchain.schema import Document

def chunk_with_metadata(text: str, source: str) -> list[Document]:
    """切分并添加元数据"""
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)
    
    documents = []
    for i, chunk in enumerate(chunks):
        doc = Document(
            page_content=chunk,
            metadata={
                "source": source,
                "chunk_index": i,
                "total_chunks": len(chunks)
            }
        )
        documents.append(doc)
    
    return documents
```

## 常见问题

### Q: chunk_size 用字符数还是 Token 数？

- 简单场景用字符数（实现简单）
- 精确控制用 Token 数（与模型限制对齐）

```python
from langchain.text_splitter import TokenTextSplitter

# 基于 Token 切分
token_splitter = TokenTextSplitter(
    chunk_size=500,  # Token 数
    chunk_overlap=50
)
```

### Q: overlap 设多少合适？

通常设为 chunk_size 的 10-20%。太少可能丢失上下文，太多浪费存储。

### Q: 不同类型内容混在一起怎么办？

先按类型分开（如标题、正文、代码块），再分别切分。

## 学习资源

- [LangChain Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers)
- [Chunking Strategies 对比](https://www.pinecone.io/learn/chunking-strategies/)

---

{/* TODO: 补充不同场景的切分参数对比实验 */}
