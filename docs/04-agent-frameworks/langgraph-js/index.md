---
title: LangGraph.js 基础
sidebar_position: 1
tags: [LangGraph, 状态机, Agent]
---

# LangGraph.js 基础

> 掌握图编排框架，构建复杂的 Agent 工作流

## 学习目标

- 理解 LangGraph 的状态管理机制
- 掌握图编排与条件路由
- 实现推理循环与人机协作

## 知识模块

### 1. 状态管理

| 概念 | 说明 |
|------|------|
| State Schema | 定义状态的数据结构 |
| Reducers | 状态更新逻辑 |
| Checkpointing | 状态持久化与恢复 |

```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';

// 定义状态结构
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  currentStep: Annotation<string>(),
});

// 创建图
const graph = new StateGraph(StateAnnotation);
```

### 2. 图编排

| 组件 | 说明 |
|------|------|
| 节点（Node） | 执行具体逻辑的函数 |
| 边（Edge） | 节点之间的连接 |
| 条件边 | 根据条件选择下一个节点 |

```typescript
// 定义节点
const callModel = async (state) => {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
};

const callTool = async (state) => {
  // 执行工具调用
  const result = await executeTool(state);
  return { messages: [result] };
};

// 构建图
graph
  .addNode('agent', callModel)
  .addNode('tools', callTool)
  .addEdge('__start__', 'agent')
  .addConditionalEdges('agent', shouldContinue, {
    continue: 'tools',
    end: '__end__',
  })
  .addEdge('tools', 'agent');
```

### 3. 推理循环

| 模式 | 说明 |
|------|------|
| ReAct 循环 | 思考 → 行动 → 观察 → 循环 |
| 人机协作 | 中断等待人工确认 |
| 错误恢复 | 从检查点恢复执行 |

```typescript
// 条件判断函数
const shouldContinue = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage.tool_calls?.length > 0) {
    return 'continue';
  }
  return 'end';
};

// 编译并运行
const app = graph.compile();
const result = await app.invoke({
  messages: [{ role: 'user', content: '查询北京天气' }],
});
```

## 核心模式

### Agent 执行流程

```
┌─────────────────────────────────────────┐
│                                         │
│    ┌──────────┐    有工具调用    ┌──────────┐
│    │  Agent   │ ───────────────→ │  Tools   │
│    │ (Model)  │                  │ (执行)   │
│    └────┬─────┘ ←─────────────── └──────────┘
│         │         返回结果
│         │ 无工具调用
│         ↓
│    ┌──────────┐
│    │   End    │
│    └──────────┘
│                                         │
└─────────────────────────────────────────┘
```

### Checkpointing（状态持久化）

```typescript
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

// 运行时指定 thread_id
const config = { configurable: { thread_id: 'user-123' } };
await app.invoke({ messages: [...] }, config);

// 后续调用自动恢复状态
await app.invoke({ messages: [...] }, config);
```

## 实践项目

1. 实现带工具的 ReAct Agent
2. 构建多步骤任务执行器
3. 实现人机协作审批流程

## 学习资源

- [LangGraph.js 官方文档](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph Tutorials](https://langchain-ai.github.io/langgraphjs/tutorials/)
