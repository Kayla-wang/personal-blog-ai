---
title: 模型选择（成本 vs 能力 vs 速度）
sidebar_position: 4
tags: [LLM, 模型选择, 成本优化]
---

# 模型选择

> 如何在成本、能力、速度之间找到平衡

## 概述

没有"最好"的模型，只有最适合场景的模型。本文帮你建立模型选择的决策框架。

## 核心概念

### 1. 三个维度

```
能力（Quality）
    │
    │     ★ GPT-4o / Claude 3.5 Opus
    │
    │         ★ Claude 3.5 Sonnet / GPT-4o
    │
    │             ★ GPT-4o-mini / DeepSeek
    │
    │                 ★ GPT-3.5-turbo
    │
    └──────────────────────────────────────→ 成本（Cost）
    
速度：GPT-4o-mini > GPT-4o ≈ Claude Sonnet > Claude Opus
```

### 2. 成本对比（2024 数据）

| 模型 | 输入价格 | 输出价格 | 相对成本 |
|------|----------|----------|----------|
| GPT-4o | $2.5/1M | $10/1M | 基准 |
| GPT-4o-mini | $0.15/1M | $0.6/1M | 1/15 |
| Claude Sonnet | $3/1M | $15/1M | 1.2x |
| DeepSeek V3 | ¥1/1M | ¥2/1M | 1/10 |

### 3. 能力层级

```
Tier 1（最强）: GPT-4o, Claude 3.5 Sonnet
- 复杂推理、代码生成、长文档理解

Tier 2（平衡）: GPT-4o-mini, Claude Haiku
- 简单对话、分类、提取

Tier 3（经济）: DeepSeek, Qwen
- 成本敏感场景、大批量处理
```

## 实践要点

### 分层模型策略

{/* TODO: 补充实际项目的模型路由代码 */}

```python
class ModelRouter:
    """根据任务复杂度路由到不同模型"""
    
    def select_model(self, task: str, complexity: str) -> str:
        # 简单任务用便宜模型
        if complexity == "simple":
            return "gpt-4o-mini"
        
        # 代码任务用 Claude
        if "code" in task:
            return "claude-3-5-sonnet"
        
        # 复杂推理用 GPT-4o
        if complexity == "complex":
            return "gpt-4o"
        
        # 默认
        return "gpt-4o-mini"
```

### 成本优化实战

```python
# 1. 开发环境用便宜模型
DEV_MODEL = "gpt-4o-mini"
PROD_MODEL = "gpt-4o"

model = DEV_MODEL if os.getenv("ENV") == "dev" else PROD_MODEL

# 2. 批量任务用便宜模型
async def batch_process(items: list[str]):
    # 批量处理 1000 条，用便宜模型
    return await asyncio.gather(*[
        call_llm(item, model="gpt-4o-mini")
        for item in items
    ])

# 3. 先用小模型判断，再决定是否用大模型
async def smart_route(query: str):
    # 用小模型判断复杂度
    complexity = await call_llm(
        f"判断这个问题的复杂度（simple/complex）: {query}",
        model="gpt-4o-mini"
    )
    
    # 根据复杂度选模型
    final_model = "gpt-4o" if "complex" in complexity else "gpt-4o-mini"
    return await call_llm(query, model=final_model)
```

### 选择决策流程

```
1. 任务是否需要最强能力？
   └── 是 → GPT-4o / Claude Sonnet
   └── 否 → 继续判断

2. 是否大批量处理（>1000 次/天）？
   └── 是 → GPT-4o-mini / DeepSeek
   └── 否 → 继续判断

3. 是否需要国内合规？
   └── 是 → Qwen / 百度
   └── 否 → 继续判断

4. 延迟是否敏感（小于 1s）？
   └── 是 → GPT-4o-mini（最快）
   └── 否 → 按成本选择
```

## 常见问题

### Q: 小模型能做 Agent 吗？

可以，但能力有限。建议：
- 简单 Agent（单工具、明确任务）→ GPT-4o-mini
- 复杂 Agent（多工具、规划推理）→ GPT-4o / Claude

### Q: 如何评估模型是否满足需求？

1. 准备 50-100 个测试用例
2. 分别跑不同模型
3. 计算准确率、延迟、成本
4. 找到性价比最优点

### Q: 模型 fallback 怎么做？

```python
async def call_with_fallback(prompt: str):
    models = ["gpt-4o", "claude-3-5-sonnet", "gpt-4o-mini"]
    
    for model in models:
        try:
            return await call_llm(prompt, model=model)
        except Exception:
            continue
    
    raise Exception("All models failed")
```

## 学习资源

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [LLM Benchmark](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard)

---

{/* TODO: 补充实际项目的成本分析数据 */}
