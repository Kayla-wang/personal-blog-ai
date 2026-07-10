---
title: LangChain.js 基础
sidebar_position: 1
tags: [LangChain, JavaScript, Agent]
---

# LangChain.js 基础

> 掌握 JavaScript 生态最流行的 LLM 应用开发框架

## 学习目标

- 理解 LangChain.js 的核心架构
- 掌握模型调用、工具系统、记忆模块
- 能够构建基础的 LLM 应用

## 知识模块

### 1. 模型调用

| 组件 | 说明 |
|------|------|
| Chat Models | 对话模型封装，统一接口 |
| Embeddings | 文本向量化，语义搜索基础 |
| 多模型切换 | 配置化切换不同供应商的模型 |

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';

// OpenAI
const openai = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
});

// Anthropic
const anthropic = new ChatAnthropic({
  model: 'claude-sonnet-4-20250514',
});

// 统一调用接口
const response = await openai.invoke([
  { role: 'user', content: '你好' }
]);
```

### 2. 工具系统

| 概念 | 说明 |
|------|------|
| Tool 定义 | 名称、描述、参数 Schema、执行函数 |
| Function Calling | 模型决定调用哪个工具及参数 |
| 工具链 | 多个工具组合使用 |

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const weatherTool = tool(
  async ({ city }) => {
    // 调用天气 API
    return `${city} 今天晴，25°C`;
  },
  {
    name: 'get_weather',
    description: '获取指定城市的天气',
    schema: z.object({
      city: z.string().describe('城市名称'),
    }),
  }
);
```

### 3. 记忆模块

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| Buffer Memory | 存储完整对话历史 | 短对话 |
| Summary Memory | 对话摘要 | 长对话 |
| 向量记忆 | 基于相似度检索 | 知识库问答 |

```typescript
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';

const memory = new BufferMemory();
const chain = new ConversationChain({
  llm: model,
  memory,
});

await chain.invoke({ input: '我叫小明' });
await chain.invoke({ input: '我叫什么？' }); // 记住了上下文
```

## 核心概念

### LCEL (LangChain Expression Language)

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const prompt = ChatPromptTemplate.fromTemplate(
  '用一句话解释什么是{topic}'
);

// 链式组合
const chain = prompt.pipe(model).pipe(new StringOutputParser());

const result = await chain.invoke({ topic: 'AI Agent' });
```

### Runnable 接口

所有组件都实现统一的 Runnable 接口：
- `invoke()` - 单次调用
- `stream()` - 流式输出
- `batch()` - 批量处理

## 实践项目

1. 实现一个带工具的对话机器人
2. 构建简单的 RAG 问答系统
3. 实现多轮对话记忆管理

## 学习资源

- [LangChain.js 官方文档](https://js.langchain.com/)
- [LangChain.js GitHub](https://github.com/langchain-ai/langchainjs)
