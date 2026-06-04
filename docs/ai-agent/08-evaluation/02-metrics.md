---
title: 评估指标设计
sidebar_position: 2
tags: [评估, 指标, 准确率]
---

# 评估指标设计

> 准确率、幻觉率、延迟等核心指标

## 概述

没有度量就没有改进。设计合适的评估指标，才能量化 AI 应用的效果并持续优化。

## 核心概念

### 1. 指标分类

| 类型 | 指标 | 说明 |
|------|------|------|
| 质量 | 准确率、幻觉率 | 答案是否正确 |
| 效率 | 延迟、吞吐量 | 响应速度 |
| 成本 | Token 消耗、API 费用 | 运营成本 |
| 用户 | 满意度、留存率 | 用户体验 |

### 2. RAG 特定指标

```
检索阶段：
- Recall@K：相关文档是否被检索到
- MRR：相关文档排名多高
- Precision@K：检索结果中有多少相关

生成阶段：
- Faithfulness：答案是否忠于检索内容
- Answer Relevancy：答案是否回答了问题
- Hallucination Rate：幻觉率
```

### 3. Agent 特定指标

```
- Task Completion Rate：任务完成率
- Tool Selection Accuracy：工具选择准确性
- Step Efficiency：完成任务所需步骤数
- Error Recovery Rate：错误恢复成功率
```

## 实践要点

### 基础指标计算

```python
from dataclasses import dataclass
from typing import List

@dataclass
class EvalResult:
    correct: bool
    latency_ms: float
    tokens_used: int
    
def evaluate_batch(test_cases: List[dict], agent) -> dict:
    results = []
    
    for case in test_cases:
        start = time.time()
        response = agent.run(case["input"])
        latency = (time.time() - start) * 1000
        
        is_correct = check_answer(response, case["expected"])
        
        results.append(EvalResult(
            correct=is_correct,
            latency_ms=latency,
            tokens_used=count_tokens(response)
        ))
    
    return {
        "accuracy": sum(r.correct for r in results) / len(results),
        "avg_latency_ms": sum(r.latency_ms for r in results) / len(results),
        "total_tokens": sum(r.tokens_used for r in results),
        "p95_latency_ms": np.percentile([r.latency_ms for r in results], 95)
    }
```

### RAG 评估

{/* TODO: 补充完整的 RAG 评估流水线 */}

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_recall,
    context_precision,
)

# 准备评估数据
eval_data = {
    "question": ["什么是 RAG？", "LangChain 怎么用？"],
    "answer": ["RAG 是...", "LangChain 可以..."],
    "contexts": [["RAG 全称..."], ["LangChain 是一个框架..."]],
    "ground_truth": ["检索增强生成", "LangChain 使用方法"]
}

# 运行评估
result = evaluate(
    eval_data,
    metrics=[
        faithfulness,
        answer_relevancy,
        context_recall,
        context_precision,
    ]
)

print(result)
```

### 幻觉检测

```python
async def detect_hallucination(
    question: str,
    answer: str,
    context: str,
    llm
) -> dict:
    """使用 LLM 检测幻觉"""
    
    prompt = f"""
    判断以下回答是否存在幻觉（编造信息）。
    
    问题：{question}
    参考内容：{context}
    回答：{answer}
    
    评估标准：
    1. 回答中的信息是否都能在参考内容中找到依据
    2. 是否存在编造的事实、数字、名称
    
    输出 JSON：
    {{"has_hallucination": true/false, "details": "说明"}}
    """
    
    result = await llm.with_structured_output(HallucinationResult).ainvoke(prompt)
    return result
```

### 延迟监控

```python
import time
from contextlib import contextmanager

@contextmanager
def track_latency(name: str):
    start = time.time()
    yield
    duration = (time.time() - start) * 1000
    log_metric(name, duration)

# 使用
async def rag_query(question: str):
    with track_latency("retrieval"):
        docs = await retriever.search(question)
    
    with track_latency("generation"):
        answer = await llm.generate(question, docs)
    
    with track_latency("total"):
        pass
    
    return answer
```

### 用户满意度

```python
# 收集用户反馈
@app.post("/feedback")
async def submit_feedback(
    conversation_id: str,
    rating: int,  # 1-5
    feedback_text: str = None
):
    save_feedback(conversation_id, rating, feedback_text)
    
    # 计算整体满意度
    avg_rating = calculate_average_rating(window="7d")
    
    return {"avg_rating": avg_rating}
```

## 常见问题

### Q: 没有标准答案怎么评估？

1. 使用 LLM 作为评估器（LLM-as-Judge）
2. 人工抽样评估
3. 基于规则的检查（格式、包含关键词等）

```python
# LLM-as-Judge
async def llm_judge(question: str, answer: str) -> int:
    prompt = f"""
    评估以下回答的质量（1-5分）：
    
    问题：{question}
    回答：{answer}
    
    评分标准：
    5 - 完全正确，详细全面
    4 - 基本正确，有小缺失
    3 - 部分正确，有明显问题
    2 - 大部分错误
    1 - 完全错误或无关
    
    只输出数字。
    """
    score = await llm.invoke(prompt)
    return int(score.content)
```

### Q: 评估指标太多怎么办？

聚焦核心指标，建议的优先级：
1. **准确率/任务完成率**（最重要）
2. **延迟 P95**（用户体验）
3. **成本**（运营可持续）

### Q: 如何建立基准线？

1. 先用当前版本跑一遍测试集
2. 记录各项指标作为基准
3. 每次改动后对比基准

## 学习资源

- [RAGAS 文档](https://docs.ragas.io/)
- [LangSmith Evaluations](https://docs.smith.langchain.com/evaluation)

---

{/* TODO: 补充实际项目的评估仪表盘 */}
