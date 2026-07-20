---
title: 大模型基础
sidebar_position: 1
tags: [LLM, API, Prompt]
---

# 大模型基础

> 理解大语言模型的核心概念，掌握 API 调用与 Prompt 工程基础

## 学习目标

- 理解大模型的基本原理和核心概念
- 掌握主流模型 API 的调用方法
- 入门 Prompt 工程，编写有效的提示词

## 知识模块

### 1. 模型原理

| 概念 | 说明 |
|------|------|
| Transformer | 注意力机制、编码器-解码器架构 |
| Token | 文本分词、Token 计数、上下文长度 |
| Temperature | 输出随机性控制、创造性 vs 确定性 |
| Top-p | 核采样、概率分布截断 |

### 2. API 调用

#### OpenAI API

```typescript
import OpenAI from 'openai';

const client = new OpenAI();

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '你是一个有帮助的助手' },
    { role: 'user', content: '你好' }
  ],
  temperature: 0.7,
});
```

#### Anthropic API

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: '你好' }
  ],
});
```

### 3. Prompt 工程基础

| 技术 | 说明 |
|------|------|
| System Prompt | 设定角色、行为边界、输出格式 |
| Few-shot | 提供示例引导模型输出 |
| 结构化输出 | JSON Schema、类型约束 |
| 思维链（CoT） | 引导模型逐步推理 |

## 核心概念

### Token 与成本

```
1 Token ≈ 4 个英文字符 ≈ 0.5-1 个中文字符

GPT-4o 定价（约）：
- 输入：$2.5 / 1M tokens
- 输出：$10 / 1M tokens

Claude Sonnet 定价（约）：
- 输入：$3 / 1M tokens  
- 输出：$15 / 1M tokens
```

### 上下文窗口

| 模型 | 上下文长度 |
|------|-----------|
| GPT-4o | 128K tokens |
| Claude 3.5 Sonnet | 200K tokens |
| Claude 3 Opus | 200K tokens |

## 实践练习

1. 调用 OpenAI API 实现简单对话
2. 比较不同 temperature 的输出差异
3. 编写 System Prompt 创建特定角色
4. 实现流式响应（Streaming）

## 学习资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Anthropic Claude 文档](https://docs.anthropic.com/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
