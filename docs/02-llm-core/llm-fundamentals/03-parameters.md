---
title: 核心参数（Token / Temperature / Top-P / Context Window）
sidebar_position: 3
tags: [LLM, Token, Temperature, 参数]
---

# 核心参数

> Token、Temperature、Top-P、Context Window 详解

## 概述

理解 LLM 的核心参数，才能有效控制模型行为、优化成本和体验。

## 核心概念

### 1. Token

Token 是 LLM 处理文本的基本单位，不等于字符或单词。

```
英文: "Hello world" → ["Hello", " world"] → 2 tokens
中文: "你好世界" → ["你", "好", "世", "界"] → 4 tokens（大约）
代码: "function()" → ["function", "(", ")"] → 3 tokens
```

**重要性**：
- 计费基于 Token 数量
- Context Window 限制的是 Token 数
- 中文通常比英文消耗更多 Token

**估算工具**：
- [OpenAI Tokenizer](https://platform.openai.com/tokenizer)
- 粗略估算：1 个英文单词 ≈ 1.3 tokens，1 个中文字 ≈ 2 tokens

### 2. Temperature

控制输出的随机性/创造性，范围 0-2（通常用 0-1）。

```python
# temperature = 0：确定性输出，每次相同
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    temperature=0  # 适合：代码生成、数据提取、分类
)

# temperature = 0.7：平衡创造性和一致性
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    temperature=0.7  # 适合：对话、写作
)

# temperature = 1.0+：高创造性
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    temperature=1.0  # 适合：头脑风暴、创意写作
)
```

### 3. Top-P（Nucleus Sampling）

另一种控制随机性的方式，与 Temperature 配合使用。

```python
# top_p = 0.1：只从概率最高的 10% token 中选择
# top_p = 0.9：从概率累计达到 90% 的 token 中选择
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    temperature=0.7,
    top_p=0.9  # 通常保持默认，或只调一个
)
```

**建议**：通常只调 Temperature **或** Top-P，不要同时调整

### 4. Context Window

模型一次能处理的最大 Token 数（输入 + 输出）。

```
GPT-4o:        128K tokens ≈ 约 10 万字中文
Claude 3.5:    200K tokens ≈ 约 15 万字中文
GPT-4o-mini:   128K tokens
DeepSeek:      64K tokens
```

**超出限制**：
- 会报错或被截断
- 需要分块处理或使用 RAG

## 实践要点

### 参数选择指南

| 任务类型 | Temperature | 说明 |
|----------|-------------|------|
| 代码生成 | 0 - 0.2 | 需要确定性 |
| 数据提取 | 0 | 严格按格式 |
| 分类任务 | 0 | 一致性重要 |
| 普通对话 | 0.5 - 0.7 | 平衡 |
| 创意写作 | 0.8 - 1.0 | 需要多样性 |

### Token 成本优化

```python
# 1. 精简 System Prompt
# ❌ 冗长
system = "你是一个非常有帮助的、友善的、专业的助手，你会尽力帮助用户解决问题..."

# ✅ 精简
system = "你是专业助手。简洁回答。"

# 2. 控制输出长度
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    max_tokens=500  # 限制输出长度
)

# 3. 使用便宜模型处理简单任务
simple_model = "gpt-4o-mini"  # 成本是 gpt-4o 的 1/30
```

### 计算 Token 用量

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

# 使用
tokens = count_tokens("这段文本有多少 token？")
print(f"Token 数: {tokens}")
```

## 常见问题

### Q: Temperature 设 0 还会有随机性吗？

理论上 Temperature=0 应该完全确定，但实际 API 可能仍有微小差异。需要完全一致时，可以设置 `seed` 参数。

### Q: Context Window 不够用怎么办？

1. **压缩历史**：总结之前的对话
2. **使用 RAG**：只检索相关内容
3. **分块处理**：长文档分段处理

### Q: 为什么我的中文应用 Token 消耗这么高？

中文 Token 效率低（约 1 字 = 1.5-2 token），正常现象。可以：
- 使用中文优化的模型（Qwen、Claude）
- 压缩输入内容

## 学习资源

- [OpenAI Tokenizer](https://platform.openai.com/tokenizer)
- [tiktoken 库](https://github.com/openai/tiktoken)

---

{/* TODO: 补充实际项目中的参数调优记录 */}
