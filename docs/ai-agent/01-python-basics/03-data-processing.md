---
title: 数据处理（pandas、numpy）
sidebar_position: 3
tags: [Python, pandas, numpy, 数据处理]
---

# 数据处理（pandas、numpy）

> Agent 开发中的数据处理基础

## 概述

虽然 Agent 开发不像数据科学那样重度依赖 pandas/numpy，但以下场景仍需要：

- 处理 RAG 的文档数据
- 分析 LLM 调用日志
- 评估数据集处理
- Embedding 向量操作

## 核心概念

### 1. NumPy 基础

```python
import numpy as np

# 创建向量（Embedding 的基本形式）
embedding = np.array([0.1, 0.2, 0.3, 0.4])

# 向量运算
cosine_sim = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

# 批量处理
embeddings = np.array([
    [0.1, 0.2, 0.3],
    [0.4, 0.5, 0.6],
])
```

**Agent 开发中的应用**：

- 计算向量相似度
- Embedding 归一化
- 批量向量操作

### 2. Pandas 基础

```python
import pandas as pd

# 读取数据
df = pd.read_csv("eval_dataset.csv")
df = pd.read_json("documents.json")

# 基本操作
df.head()  # 查看前几行
df.info()  # 数据概览
df["column"].value_counts()  # 统计

# 筛选
filtered = df[df["score"] > 0.8]

# 应用函数
df["processed"] = df["text"].apply(preprocess_text)
```

### 3. 数据清洗

{/* TODO: 补充实际文档处理代码 */}

```python
# 常见的文档预处理
def clean_text(text: str) -> str:
    # 去除多余空白
    text = " ".join(text.split())
    # 去除特殊字符
    text = re.sub(r'[^\w\s]', '', text)
    return text

df["clean_content"] = df["content"].apply(clean_text)
```

## 实践要点

### Agent 开发中的数据处理场景

```python
# 1. 评估数据集处理
eval_data = pd.read_csv("test_cases.csv")
results = []
for _, row in eval_data.iterrows():
    response = agent.run(row["question"])
    results.append({
        "question": row["question"],
        "expected": row["expected"],
        "actual": response,
        "correct": response == row["expected"]
    })
results_df = pd.DataFrame(results)
accuracy = results_df["correct"].mean()

# 2. LLM 调用日志分析
logs = pd.read_json("llm_calls.jsonl", lines=True)
logs["latency_ms"] = logs["end_time"] - logs["start_time"]
logs.groupby("model")["latency_ms"].describe()

# 3. Embedding 相似度计算
def cosine_similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / norms
    return np.dot(normalized, normalized.T)
```

### 与前端数据处理的对比

| 场景 | JavaScript | Python |
|------|------------|--------|
| 数组操作 | `array.map/filter/reduce` | `list comprehension` 或 `pandas` |
| JSON 处理 | 原生支持 | `json` 模块 或 `pandas` |
| CSV 处理 | 需要库 | `pandas.read_csv()` |
| 数值计算 | 手写或库 | `numpy` 内置 |

## 常见问题

### Q: Agent 开发需要深入学习 pandas 吗？

不需要。掌握以下即可：
- 读取数据（`read_csv`, `read_json`）
- 基本筛选和统计
- 应用函数处理列

### Q: 什么时候用 numpy vs 普通 list？

- **numpy**：大量数值计算、向量操作、Embedding 处理
- **list**：少量数据、混合类型、简单操作

## 学习资源

- [Pandas 10 分钟入门](https://pandas.pydata.org/docs/user_guide/10min.html)
- [NumPy 快速入门](https://numpy.org/doc/stable/user/quickstart.html)

---

{/* TODO: 补充 RAG 文档处理的实际代码 */}
