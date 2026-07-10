---
title: 多智能体系统
sidebar_position: 1
tags: [Multi-Agent, 协作, 架构]
---

# 多智能体系统

> 学习多 Agent 协作模式，构建复杂的智能系统

## 学习目标

- 理解多智能体系统的架构模式
- 掌握任务分解与协作机制
- 实现 Agent 之间的通信与协调

## 协作模式

### 1. 主从模式（Supervisor）

```
                 ┌─────────────┐
                 │  Supervisor │
                 │   (协调者)   │
                 └──────┬──────┘
            ┌──────────┼──────────┐
            ↓          ↓          ↓
      ┌──────────┐┌──────────┐┌──────────┐
      │ Worker 1 ││ Worker 2 ││ Worker 3 │
      │  (搜索)  ││  (分析)  ││  (写作)  │
      └──────────┘└──────────┘└──────────┘
```

**适用场景**：任务可分解，需要统一协调

### 2. 对等模式（Peer-to-Peer）

```
      ┌──────────┐     ┌──────────┐
      │ Agent A  │←───→│ Agent B  │
      └────┬─────┘     └────┬─────┘
           │                │
           └───────┬────────┘
                   ↓
            ┌──────────┐
            │ Agent C  │
            └──────────┘
```

**适用场景**：Agent 能力互补，需要协商

### 3. 层级模式（Hierarchical）

```
                 ┌─────────────┐
                 │   Manager   │
                 └──────┬──────┘
            ┌──────────┴──────────┐
            ↓                     ↓
      ┌──────────┐          ┌──────────┐
      │ Team Lead│          │ Team Lead│
      └────┬─────┘          └────┬─────┘
      ┌────┴────┐           ┌────┴────┐
      ↓         ↓           ↓         ↓
   ┌─────┐  ┌─────┐     ┌─────┐  ┌─────┐
   │Agent│  │Agent│     │Agent│  │Agent│
   └─────┘  └─────┘     └─────┘  └─────┘
```

**适用场景**：大型复杂任务，需要多级管理

## 核心机制

### 任务分解

```typescript
// Supervisor 分解任务
const supervisor = {
  async planTasks(goal: string) {
    const response = await model.invoke([
      {
        role: 'system',
        content: `你是任务规划专家。将目标分解为子任务，分配给合适的 Agent。
可用 Agent: researcher(搜索), analyst(分析), writer(写作)`
      },
      { role: 'user', content: goal }
    ]);
    return parseTaskPlan(response);
  }
};
```

### 通信机制

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| 消息传递 | Agent 之间发送消息 | 异步协作 |
| 共享状态 | 通过共享内存交换信息 | 实时同步 |
| 事件驱动 | 发布-订阅模式 | 松耦合协作 |

```typescript
// 共享状态实现
const SharedState = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (x, y) => x.concat(y),
  }),
  results: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
  }),
  currentAgent: Annotation<string>(),
});
```

### 结果聚合

```typescript
// 聚合多个 Agent 的结果
async function aggregateResults(results: AgentResult[]) {
  const synthesis = await model.invoke([
    {
      role: 'system',
      content: '综合以下各 Agent 的分析结果，生成最终报告'
    },
    {
      role: 'user',
      content: JSON.stringify(results)
    }
  ]);
  return synthesis;
}
```

## 实现示例

### 研究团队 Multi-Agent

```typescript
import { StateGraph } from '@langchain/langgraph';

// 定义 Agent
const researcher = createAgent('researcher', '负责搜索和收集信息');
const analyst = createAgent('analyst', '负责分析数据和发现洞察');
const writer = createAgent('writer', '负责撰写报告');

// 构建协作图
const graph = new StateGraph(SharedState)
  .addNode('supervisor', supervisorNode)
  .addNode('researcher', researcher)
  .addNode('analyst', analyst)
  .addNode('writer', writer)
  .addConditionalEdges('supervisor', routeToAgent)
  .addEdge('researcher', 'supervisor')
  .addEdge('analyst', 'supervisor')
  .addEdge('writer', 'supervisor');
```

## 设计原则

1. **单一职责**：每个 Agent 专注一个领域
2. **明确边界**：定义清晰的输入输出接口
3. **容错设计**：单个 Agent 失败不影响整体
4. **可观测性**：记录每个 Agent 的决策和结果

## 实践项目

1. 构建研究报告生成系统
2. 实现代码审查多 Agent 团队
3. 开发客服升级处理流程
