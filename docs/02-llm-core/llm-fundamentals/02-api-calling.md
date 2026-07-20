---
title: API 调用（Chat Completions / Function Calling / Streaming）
sidebar_position: 2
tags: [LLM, API, Function Calling, Streaming]
---

# API 调用

> Chat Completions、Function Calling、Streaming 实战

## 概述

掌握 LLM API 的调用方式是 Agent 开发的基础。本文覆盖三种核心模式：对话补全、函数调用、流式响应。

## 核心概念

### 1. Chat Completions 基础

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "什么是 RAG？"}
    ]
)

print(response.choices[0].message.content)
```

**消息角色**：
- `system`：设定 AI 的行为和身份
- `user`：用户输入
- `assistant`：AI 回复（用于多轮对话）

### 2. Function Calling（Tool Use）

{/* TODO: 补充完整的 Function Calling 示例 */}

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称"
                    }
                },
                "required": ["city"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=tools,
    tool_choice="auto"  # 让模型决定是否调用
)

# 检查是否需要调用工具
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    # 执行实际函数...
```

**为什么重要**：Function Calling 是 Agent 使用工具的基础

### 3. Streaming（流式响应）

```python
# 流式响应 - 逐 chunk 返回
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "写一个故事"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

**应用场景**：
- 聊天界面实时显示
- 长文本生成体验优化
- SSE 推送给前端

## 实践要点

### TypeScript 版本（Vercel AI SDK）

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = await streamText({
  model: openai('gpt-4o'),
  messages: [{ role: 'user', content: 'Hello' }],
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### 错误处理

```python
from openai import RateLimitError, APITimeoutError

try:
    response = client.chat.completions.create(...)
except RateLimitError:
    # 触发限流，需要等待或使用备用模型
    time.sleep(60)
except APITimeoutError:
    # 超时，可以重试
    pass
```

### 多模型适配

```python
# 使用 LangChain 统一接口
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

# 相同接口，不同模型
gpt = ChatOpenAI(model="gpt-4o")
claude = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# 调用方式完全一样
response = gpt.invoke("Hello")
response = claude.invoke("Hello")
```

## 常见问题

### Q: Function Calling 和普通提示词有什么区别？

Function Calling 让模型结构化地表达"我需要调用这个函数，参数是这些"，而不是自由文本输出。更可靠、更易解析。

### Q: 什么时候用流式响应？

- 用户等待时间 > 2 秒的场景
- 需要实时展示的聊天界面
- 长文本生成

### Q: API Key 安全吗？

**永远不要**在前端暴露 API Key。通过后端代理调用。

## 学习资源

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Docs](https://docs.anthropic.com/claude/reference)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

{/* TODO: 补充实际项目中的 API 调用封装代码 */}
