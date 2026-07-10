---
title: Agent 核心原理
sidebar_position: 1
tags: [Agent, ReAct, 工具调用]
---

# Agent 核心原理

> 深入理解 AI Agent 的核心机制：ReAct、工具调用、记忆管理

## 学习目标

- 掌握 ReAct 范式的原理与实现
- 理解工具调用的完整流程
- 设计有效的记忆管理策略

## 知识模块

### 1. ReAct 范式

**ReAct = Reasoning + Acting**

```
用户输入 → 思考(Thought) → 行动(Action) → 观察(Observation) → 循环...
```

| 阶段 | 说明 |
|------|------|
| Thought | 模型分析问题，规划下一步 |
| Action | 选择并执行工具 |
| Observation | 获取工具执行结果 |
| 循环/终止 | 根据结果决定继续还是输出答案 |

#### ReAct 示例

```
User: 北京今天的天气怎么样？

Thought: 用户想知道北京的天气，我需要调用天气查询工具
Action: get_weather(city="北京")
Observation: 北京今天晴，气温 25°C，空气质量良好

Thought: 我已经获取到天气信息，可以回答用户了
Answer: 北京今天天气晴朗，气温 25°C，空气质量良好，适合户外活动。
```

### 2. 工具调用

#### 工具选择策略

| 策略 | 说明 |
|------|------|
| 描述匹配 | 根据工具描述与用户意图匹配 |
| 参数提取 | 从用户输入中提取工具参数 |
| 多工具编排 | 复杂任务需要多个工具协作 |

#### 工具设计原则

```typescript
// 好的工具设计
const searchTool = tool(
  async ({ query, limit }) => { ... },
  {
    name: 'web_search',
    description: '搜索互联网获取最新信息。当用户询问时事、新闻或需要最新数据时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
      limit: z.number().default(5).describe('返回结果数量'),
    }),
  }
);
```

**设计要点**：
- 名称清晰：一眼看懂用途
- 描述详细：说明何时使用
- 参数明确：类型、默认值、说明

### 3. 记忆管理

| 记忆类型 | 存储内容 | 生命周期 |
|----------|----------|----------|
| 短期记忆 | 当前对话上下文 | 会话内 |
| 长期记忆 | 用户偏好、历史摘要 | 跨会话 |
| 工作记忆 | 当前任务状态 | 任务内 |

#### 记忆策略选择

```
对话长度 < 10 轮  → Buffer Memory（完整存储）
对话长度 10-50 轮 → Summary Memory（摘要压缩）
需要检索历史     → Vector Memory（向量检索）
```

#### 实现示例

```typescript
// 混合记忆策略
class HybridMemory {
  shortTerm: Message[] = [];      // 最近 N 轮
  summary: string = '';           // 历史摘要
  vectorStore: VectorStore;       // 重要信息向量化

  async addMessage(message: Message) {
    this.shortTerm.push(message);
    
    // 超过阈值时压缩
    if (this.shortTerm.length > 10) {
      await this.compress();
    }
  }

  async getContext(query: string) {
    const relevant = await this.vectorStore.search(query);
    return {
      summary: this.summary,
      recent: this.shortTerm,
      relevant,
    };
  }
}
```

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent 核心架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│   │  输入   │───→│  规划   │───→│  执行   │               │
│   │ Parser  │    │ Planner │    │ Executor│               │
│   └─────────┘    └────┬────┘    └────┬────┘               │
│                       │              │                      │
│                       ↓              ↓                      │
│                  ┌─────────┐    ┌─────────┐               │
│                  │  记忆   │←──→│  工具   │               │
│                  │ Memory  │    │  Tools  │               │
│                  └─────────┘    └─────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 实践项目

1. 实现一个完整的 ReAct Agent
2. 设计多工具协作的任务流程
3. 构建带长期记忆的对话助手

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| 工具选择错误 | 优化工具描述，添加负面示例 |
| 陷入循环 | 设置最大迭代次数，添加终止条件 |
| 上下文超长 | 使用摘要压缩，按相关性检索 |
| 响应延迟 | 流式输出，并行工具调用 |
