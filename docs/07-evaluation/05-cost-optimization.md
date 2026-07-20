---
title: 成本优化
sidebar_position: 5
tags: [成本优化, Token, 缓存]
---

# 成本优化

> Token 压缩、缓存策略、模型选择

## 概述

LLM API 调用成本可能很高。掌握成本优化技巧，让应用在保证质量的同时控制开支。

## 核心概念

### 1. 成本构成

```
总成本 = 调用次数 × 单次成本
单次成本 = (输入 Token × 输入价格) + (输出 Token × 输出价格)
```

### 2. 优化方向

| 方向 | 方法 | 效果 |
|------|------|------|
| 减少输入 | Prompt 压缩、精简上下文 | 显著 |
| 减少输出 | 限制输出长度、简洁指令 | 中等 |
| 减少调用 | 缓存、批处理 | 显著 |
| 降低单价 | 选择便宜模型 | 显著 |

## 实践要点

### Prompt 压缩

```python
# ❌ 冗长的 System Prompt
system_verbose = """
你是一个非常有帮助的人工智能助手，你的目标是尽可能地帮助用户解决他们遇到的各种问题。
你应该保持友善、专业的态度，并且尽量给出详细、准确的回答。
如果你不知道答案，请诚实地告诉用户你不知道，不要编造信息。
在回答问题时，请考虑用户的背景和需求，给出最合适的回答。
"""

# ✅ 精简版本
system_concise = "你是编程助手。简洁准确回答。不确定时说明。"

# Token 节省：约 80%
```

### 智能上下文管理

{/* TODO: 补充更多上下文管理策略 */}

```python
def manage_context(messages: list[dict], max_tokens: int = 4000) -> list[dict]:
    """智能管理对话上下文"""
    
    # 计算当前 Token
    total_tokens = sum(count_tokens(m["content"]) for m in messages)
    
    if total_tokens <= max_tokens:
        return messages
    
    # 策略 1: 保留最近 N 轮
    recent = messages[-6:]  # 最近 3 轮对话
    
    # 策略 2: 摘要历史
    if len(messages) > 6:
        history = messages[:-6]
        summary = summarize_conversation(history)
        return [{"role": "system", "content": f"历史摘要：{summary}"}] + recent
    
    return recent

def summarize_conversation(messages: list[dict]) -> str:
    """使用便宜模型摘要历史"""
    prompt = f"简要总结以下对话的要点：\n{format_messages(messages)}"
    return call_llm(prompt, model="gpt-4o-mini")  # 用便宜模型
```

### 缓存策略

```python
import hashlib
import json
from functools import lru_cache

# 内存缓存
@lru_cache(maxsize=1000)
def cached_embedding(text: str) -> tuple:
    """缓存 Embedding 结果"""
    embedding = get_embedding(text)
    return tuple(embedding)

# Redis 缓存
class LLMCache:
    def __init__(self, redis_client, ttl: int = 3600):
        self.redis = redis_client
        self.ttl = ttl
    
    def _get_key(self, prompt: str, model: str) -> str:
        content = json.dumps({"prompt": prompt, "model": model}, sort_keys=True)
        return f"llm:{hashlib.md5(content.encode()).hexdigest()}"
    
    async def get_or_call(self, prompt: str, model: str) -> str:
        key = self._get_key(prompt, model)
        
        # 检查缓存
        cached = self.redis.get(key)
        if cached:
            return cached.decode()
        
        # 调用 API
        response = await call_llm(prompt, model)
        
        # 缓存结果
        self.redis.setex(key, self.ttl, response)
        
        return response
```

### 模型路由

```python
class SmartModelRouter:
    """根据任务复杂度选择模型"""
    
    def __init__(self):
        self.complexity_classifier = load_classifier()
    
    def select_model(self, prompt: str) -> str:
        # 快速判断复杂度
        complexity = self.classify_complexity(prompt)
        
        if complexity == "simple":
            return "gpt-4o-mini"  # $0.15/1M input
        elif complexity == "medium":
            return "gpt-4o"       # $2.5/1M input
        else:
            return "gpt-4o"       # 复杂任务用强模型
    
    def classify_complexity(self, prompt: str) -> str:
        # 简单规则
        if len(prompt) < 100:
            return "simple"
        if "分析" in prompt or "对比" in prompt:
            return "complex"
        return "medium"
```

### 批处理

```python
async def batch_process(items: list[str], batch_size: int = 10) -> list[str]:
    """批量处理，减少 API 调用次数"""
    
    results = []
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        
        # 合并为一次调用
        combined_prompt = "\n---\n".join([
            f"[{j+1}] {item}" 
            for j, item in enumerate(batch)
        ])
        
        prompt = f"""
        处理以下 {len(batch)} 个请求，每个用 [N] 标记序号：
        
        {combined_prompt}
        
        按相同格式输出每个结果。
        """
        
        response = await call_llm(prompt)
        batch_results = parse_batch_response(response)
        results.extend(batch_results)
    
    return results
```

### 成本监控

```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CostRecord:
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    cost: float

PRICING = {
    "gpt-4o": {"input": 2.5, "output": 10},  # per 1M tokens
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},
}

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = PRICING.get(model, PRICING["gpt-4o"])
    return (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000

def track_cost(model: str, input_tokens: int, output_tokens: int):
    cost = calculate_cost(model, input_tokens, output_tokens)
    record = CostRecord(
        timestamp=datetime.utcnow(),
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost=cost
    )
    save_cost_record(record)
    
    # 检查预算
    daily_cost = get_daily_cost()
    if daily_cost > DAILY_BUDGET:
        send_alert("日预算超支警告")
```

## 常见问题

### Q: 缓存 LLM 响应安全吗？

适合缓存：
- 知识性问题（相同问题相同答案）
- Embedding 结果

不适合缓存：
- 需要时效性的内容
- 个性化回答

### Q: 用便宜模型会影响效果吗？

| 任务类型 | 推荐 |
|----------|------|
| 简单分类 | gpt-4o-mini（够用） |
| 复杂推理 | gpt-4o（必须） |
| 创意写作 | gpt-4o（更好） |

### Q: 如何设置预算警报？

```python
# 设置每日/每月预算
DAILY_BUDGET = 10  # $10/天
MONTHLY_BUDGET = 200

# 定期检查
if get_daily_cost() > DAILY_BUDGET * 0.8:
    send_alert("即将达到日预算 80%")
```

## 学习资源

- [OpenAI Pricing](https://openai.com/pricing)
- [Token 优化技巧](https://platform.openai.com/docs/guides/rate-limits)

---

{/* TODO: 补充实际成本优化案例 */}
