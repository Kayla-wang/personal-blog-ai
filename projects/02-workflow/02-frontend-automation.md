---
title: 前端自动化工具
sidebar_position: 2
tags: [自动化, 浏览器, Playwright, Agent]
---

# 前端自动化工具(浏览器自动化 Agent)

> 用自然语言指挥浏览器完成任务:填表、抓取、E2E 测试生成、UI 回归。这是「前端转 Agent」路线的**差异化主打项目**——把前端专精(DOM、选择器、测试)直接变成别人难复制的 Agent 能力。

## 项目概述

### 功能范围

- **表单自动填写**:自然语言描述 → Agent 定位字段并填写提交
- **页面数据抓取**:非结构化页面 → 结构化数据
- **E2E 测试生成**:一句话需求 → 可运行的 Playwright 测试脚本
- **UI 回归检测**:截图对比,发现视觉变化
- **失败自愈**:选择器失效时用可访问性树重新定位

### 技术栈

- 浏览器驱动:Playwright
- LLM 编排:Vercel AI SDK + LangChain.js
- 状态机/循环控制:LangGraph.js
- 页面理解:可访问性树(a11y tree)+ 精简 DOM
- 可选进阶:MCP 封装浏览器工具

## 架构设计

核心是一个 **ReAct / Plan-and-Execute 循环**:感知页面 → LLM 规划 → 执行动作 → 观察结果 → 判断是否完成。

```
┌──────────────────────────────────────────────┐
│              浏览器自动化 Agent                │
│                                                │
│  自然语言任务                                  │
│       ↓                                        │
│  ┌─────────┐   规划    ┌──────────────┐       │
│  │  Planner │ ───────→ │  下一步动作   │       │
│  └─────────┘           └──────┬───────┘       │
│       ↑                       ↓                │
│  ┌─────────┐          ┌──────────────┐        │
│  │ 观察结果 │ ←─────── │ Playwright   │        │
│  │(a11y树/ │  执行     │ 工具执行     │        │
│  │ 截图/DOM)│          └──────────────┘        │
│  └─────────┘                                   │
│       │  未完成则回到 Planner 继续循环          │
│       └──────────────→ 完成 → 输出结果         │
└──────────────────────────────────────────────┘
```

## 核心模块

### 1. 页面感知:把页面喂给 LLM

原始 DOM 太长且噪声大。用**可访问性树**提取可交互元素,给每个元素编号,LLM 只需要引用编号。

```typescript
import { Page } from 'playwright';

// 提取可交互元素,附带稳定的引用编号
async function snapshotPage(page: Page) {
  const snapshot = await page.accessibility.snapshot();
  const elements = await page.$$eval(
    'a, button, input, textarea, select, [role=button]',
    (nodes) =>
      nodes.map((el, i) => ({
        ref: i,
        tag: el.tagName.toLowerCase(),
        text: (el as HTMLElement).innerText?.slice(0, 80) ?? '',
        name: el.getAttribute('aria-label') ?? el.getAttribute('name') ?? '',
        type: el.getAttribute('type') ?? '',
      })),
  );
  return { tree: snapshot, elements };
}
```

### 2. 工具定义:Agent 能做的动作

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const clickTool = tool({
  description: '点击页面上指定编号的元素',
  parameters: z.object({ ref: z.number().describe('元素编号') }),
  execute: async ({ ref }) => {
    await elementByRef(ref).click();
    return { ok: true };
  },
});

const typeTool = tool({
  description: '在指定编号的输入框中输入文本',
  parameters: z.object({ ref: z.number(), text: z.string() }),
  execute: async ({ ref, text }) => {
    await elementByRef(ref).fill(text);
    return { ok: true };
  },
});

const navigateTool = tool({
  description: '跳转到指定 URL',
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    await page.goto(url);
    return { ok: true };
  },
});

const extractTool = tool({
  description: '按 schema 从当前页面抽取结构化数据',
  parameters: z.object({ selector: z.string(), fields: z.array(z.string()) }),
  execute: async ({ selector, fields }) => extractData(selector, fields),
});
```

### 3. 规划循环:用 LangGraph.js 做状态机

```typescript
import { StateGraph, END } from '@langchain/langgraph';

// 状态:任务 + 历史步骤 + 是否完成
const graph = new StateGraph({ channels: agentState })
  .addNode('perceive', snapshotNode)   // 感知页面
  .addNode('plan', plannerNode)        // LLM 决定下一步动作
  .addNode('act', executeToolNode)     // 执行 Playwright 动作
  .addEdge('perceive', 'plan')
  .addEdge('act', 'perceive')
  .addConditionalEdges('plan', (s) =>
    s.done ? END : 'act',              // 完成则结束,否则继续执行
  );

const app = graph.compile();
await app.invoke({ task: '在登录页填入账号并提交' });
```

### 4. 失败回放与自愈

选择器失效是浏览器自动化最常见的失败源。用可访问性树按语义重新定位,而不是死磕 CSS 选择器。

```typescript
async function resilientClick(intent: string) {
  try {
    await page.click(cachedSelector[intent]);
  } catch {
    // 选择器失效:重新快照,让 LLM 按语义找到目标元素
    const { elements } = await snapshotPage(page);
    const ref = await askLLMToLocate(intent, elements);
    await elementByRef(ref).click();
    cachedSelector[intent] = await stableSelectorOf(ref); // 更新缓存
  }
}
```

### 5. 可观测:每步截图 + 日志

```typescript
interface Step {
  index: number;
  action: string;      // 'click' | 'type' | 'navigate' | ...
  target: string;
  screenshot: string;  // 每步截图路径,用于回放和调试
  timestamp: number;
  tokensUsed: number;  // 成本统计
}
```

## 实现步骤

### Step 1:跑通最小闭环

先不做规划,手写一个固定流程(打开页面 → 填表 → 提交),确认 Playwright + 截图 + 日志链路通。

### Step 2:接入 LLM 规划

把页面快照 + 工具定义交给 LLM,让它决定下一步动作,替换掉硬编码流程。先用单步决策,跑通 ReAct 循环。

### Step 3:用 LangGraph.js 管理状态

引入状态机,处理循环终止条件、最大步数限制、错误分支。

### Step 4:加固与自愈

加入选择器失效重定位、超时重试、危险动作确认(见下方安全边界)。

### Step 5:工程化

Docker 化(含 Playwright 浏览器依赖)、任务回放录制、成本统计面板。

## 安全边界(面试高频)

浏览器 Agent 直接操作真实页面,安全边界是必答题:

1. **动作白名单**:限制可访问的域名,禁止跳转到任意站点
2. **危险动作确认**:删除、支付、提交等不可逆操作需人工确认(human-in-the-loop)
3. **最大步数 / 超时**:防止 Agent 陷入死循环烧钱
4. **敏感信息隔离**:凭据不进入 LLM 上下文,由工具层注入
5. **沙箱运行**:在隔离容器中执行,限制文件/网络访问

## 对标开源项目

| 项目 | 用途 |
|------|------|
| [browser-use](https://github.com/browser-use/browser-use) | 主打项目直接对标,可访问性树喂 LLM 的思路 |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | 用 MCP 标准封装浏览器工具 |
| [OpenHands](https://github.com/All-Hands-AI/OpenHands) | 学习 agent loop 与安全边界设计 |

## 面试话术

- **为什么用可访问性树而不是原始 DOM**:token 成本、稳定性、语义清晰。
- **选择器失效怎么办**:语义重定位 + 缓存更新的自愈机制。
- **如何防止 Agent 失控**:最大步数、危险动作确认、域名白名单、沙箱。
- **成本怎么控制**:精简页面快照、缓存稳定选择器、限制循环步数。

## 进阶功能

- [ ] MCP 封装浏览器工具,供其他 Agent 复用
- [ ] 多标签页 / 多任务并发
- [ ] 视觉理解(截图直接喂多模态模型,不依赖 DOM)
- [ ] 测试脚本自动生成与维护
