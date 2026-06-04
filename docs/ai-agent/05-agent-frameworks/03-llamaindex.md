---
title: LlamaIndex（RAG / 知识检索）
sidebar_position: 3
tags: [Agent, LlamaIndex, RAG]
---

# LlamaIndex

> 专注于 RAG 和知识检索的框架

## 概述

LlamaIndex（原 GPT Index）专注于连接 LLM 和数据，在 RAG 场景下比 LangChain 更专业。

## 核心概念

### 1. LlamaIndex vs LangChain

| 方面 | LlamaIndex | LangChain |
|------|------------|-----------|
| 定位 | RAG 专家 | 通用框架 |
| 索引能力 | 强（多种索引类型） | 一般 |
| Agent | 基础支持 | 丰富 |
| 学习曲线 | 较平缓 | 较陡 |

### 2. 核心组件

```
LlamaIndex 架构：
├── Documents    # 数据加载
├── Nodes        # 文档切分后的节点
├── Indexes      # 索引（向量/列表/树...）
├── Retrievers   # 检索器
├── Query Engine # 查询引擎
└── Agents       # Agent 能力
```

### 3. 基本流程

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# 1. 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 2. 创建索引
index = VectorStoreIndex.from_documents(documents)

# 3. 查询
query_engine = index.as_query_engine()
response = query_engine.query("什么是 RAG？")
print(response)
```

## 实践要点

### 文档加载

{/* TODO: 补充更多数据源示例 */}

```python
from llama_index.core import SimpleDirectoryReader
from llama_index.readers.web import SimpleWebPageReader

# 本地文件
documents = SimpleDirectoryReader(
    input_dir="./data",
    recursive=True,
    required_exts=[".pdf", ".txt", ".md"]
).load_data()

# 网页
web_docs = SimpleWebPageReader(html_to_text=True).load_data(
    ["https://example.com/page1", "https://example.com/page2"]
)

# 自定义 Reader
from llama_index.core import Document

docs = [
    Document(text="文档内容1", metadata={"source": "db", "id": 1}),
    Document(text="文档内容2", metadata={"source": "db", "id": 2}),
]
```

### 索引类型

```python
from llama_index.core import (
    VectorStoreIndex,
    SummaryIndex,
    TreeIndex,
    KeywordTableIndex
)

# 向量索引（最常用）
vector_index = VectorStoreIndex.from_documents(documents)

# 摘要索引（遍历所有文档）
summary_index = SummaryIndex.from_documents(documents)

# 树形索引（层级摘要）
tree_index = TreeIndex.from_documents(documents)

# 关键词索引
keyword_index = KeywordTableIndex.from_documents(documents)
```

### 自定义检索

```python
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor

# 自定义检索器
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=10,
)

# 后处理器（过滤低分结果）
postprocessor = SimilarityPostprocessor(similarity_cutoff=0.7)

# 组装查询引擎
query_engine = RetrieverQueryEngine(
    retriever=retriever,
    node_postprocessors=[postprocessor]
)

response = query_engine.query("问题")
```

### 混合搜索

```python
from llama_index.core.retrievers import QueryFusionRetriever

# 创建多个检索器
vector_retriever = index.as_retriever(similarity_top_k=5)
keyword_retriever = keyword_index.as_retriever(similarity_top_k=5)

# 融合检索器
fusion_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, keyword_retriever],
    mode="reciprocal_rerank",  # RRF 融合
    similarity_top_k=5
)
```

### Agent 能力

```python
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool, ToolMetadata

# 将索引包装为工具
query_tool = QueryEngineTool(
    query_engine=query_engine,
    metadata=ToolMetadata(
        name="knowledge_base",
        description="查询知识库获取信息"
    )
)

# 创建 Agent
agent = ReActAgent.from_tools(
    tools=[query_tool],
    llm=llm,
    verbose=True
)

response = agent.chat("根据知识库回答：...")
```

### 持久化

```python
from llama_index.core import StorageContext, load_index_from_storage

# 保存索引
index.storage_context.persist(persist_dir="./storage")

# 加载索引
storage_context = StorageContext.from_defaults(persist_dir="./storage")
index = load_index_from_storage(storage_context)
```

## 常见问题

### Q: LlamaIndex 和 LangChain 可以一起用吗？

可以。常见模式：
- LlamaIndex 做索引和检索
- LangChain 做 Agent 和链式调用

```python
from llama_index.core.langchain_helpers.agents import IndexToolConfig, LlamaIndexTool

# 将 LlamaIndex 工具导入 LangChain
tool_config = IndexToolConfig(query_engine=query_engine, name="kb", description="...")
langchain_tool = LlamaIndexTool.from_tool_config(tool_config)
```

### Q: 大文档怎么处理？

LlamaIndex 自动切分，可以自定义：

```python
from llama_index.core.node_parser import SentenceSplitter

parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)
nodes = parser.get_nodes_from_documents(documents)
index = VectorStoreIndex(nodes)
```

### Q: 如何评估 RAG 效果？

```python
from llama_index.core.evaluation import RetrieverEvaluator

# 准备评估数据
eval_queries = ["问题1", "问题2"]
eval_answers = ["答案1", "答案2"]

# 评估
evaluator = RetrieverEvaluator.from_metric_names(["hit_rate", "mrr"])
results = await evaluator.aevaluate_dataset(...)
```

## 学习资源

- [LlamaIndex 官方文档](https://docs.llamaindex.ai/)
- [LlamaIndex GitHub](https://github.com/run-llama/llama_index)

---

{/* TODO: 补充生产级 RAG 系统架构 */}
