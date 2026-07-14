---
title: 前端工程师转型 AI 全栈路线
sidebar_position: 1
tags: [AI, 全栈, Node.js, LangChain.js]
---

# 前端工程师转型 AI 全栈路线

> 基于 Node.js 生态的 AI 全栈开发学习路径

## 学习路线图

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端 → AI 全栈 转型路径                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 基础层          2. AI层           3. 应用层      4. 进阶层   │
│  ━━━━━━━━━━        ━━━━━━━━━━        ━━━━━━━━━━    ━━━━━━━━━━  │
│                                                                 │
│  Node.js后端  ──→  LangChain.js  ──→  Agent核心  ──→  多智能体  │
│  ├─ Nest.js        ├─ 模型调用        ├─ ReAct       ├─ 协作模式│
│  ├─ HTTP协议       ├─ 工具系统        ├─ 工具调用    ├─ RAG技术 │
│  ├─ 异步编程       └─ 记忆模块        └─ 记忆管理    └─ 模型微调│
│  └─ 数据库                                                      │
│                    LangGraph.js  ──→  完整Agent  ──→  开源贡献  │
│  大模型基础        ├─ 状态管理        └─ 需求→部署   └─ 最佳实践│
│  ├─ 模型原理       ├─ 图编排                                    │
│  ├─ API调用        └─ 推理循环                                  │
│  └─ Prompt工程                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 模块概览

| 阶段 | 模块 | 核心内容 | 预计时间 |
|------|------|----------|----------|
| 基础层 | [Node.js 后端](./01-nodejs-backend/index.md) | Nest.js、HTTP协议、异步编程、数据库 | 2-3 周 |
| 基础层 | [大模型基础](./02-llm-basics/index.md) | 模型原理、API调用、Prompt工程基础 | 1-2 周 |
| AI层 | [LangChain.js](./03-langchainjs/index.md) | 模型调用、工具系统、记忆模块 | 2-3 周 |
| AI层 | [LangGraph.js](./04-langgraphjs/index.md) | 状态管理、图编排、推理循环 | 2 周 |
| 应用层 | [Agent 核心原理](./05-agent-core/index.md) | ReAct范式、工具调用、记忆管理 | 2 周 |
| 应用层 | [Agent 项目实战](./06-agent-project/index.md) | 从需求分析到部署上线 | 3-4 周 |
| 进阶层 | [多智能体系统](./07-multi-agent/index.md) | 协作模式、任务分解、通信机制 | 2-3 周 |
| 进阶层 | RAG 技术(规划中) | 文档处理、向量检索、混合搜索 | 2 周 |
| 进阶层 | 模型微调(规划中) | 数据准备、训练流程、评估优化 | 2-3 周 |

## 各层详细说明

### 1. 基础层

巩固后端开发能力，建立 AI 基础认知。

#### Node.js 后端开发
- **Nest.js 框架**：模块化架构、依赖注入、装饰器模式
- **HTTP 协议**：RESTful API、WebSocket、SSE 流式响应
- **异步编程**：Promise、async/await、事件循环
- **数据库操作**：TypeORM/Prisma、PostgreSQL、Redis

#### 大模型基础
- **模型原理**：Transformer 架构、Token 概念、上下文窗口
- **API 调用**：OpenAI API、Anthropic API、国产模型 API
- **Prompt 工程基础**：System Prompt、Few-shot、结构化输出

### 2. AI 层

掌握 JavaScript 生态的 AI 开发框架。

#### LangChain.js 基础
- **模型调用**：Chat Models、Embeddings、多模型切换
- **工具系统**：Tool 定义、Function Calling、工具链
- **记忆模块**：Buffer Memory、Summary Memory、向量记忆

#### LangGraph.js 基础
- **状态管理**：State Schema、Reducers、Checkpointing
- **图编排**：节点定义、边连接、条件路由
- **推理循环**：循环控制、人机协作、错误恢复

### 3. 应用层

理解 Agent 核心原理，完成端到端项目。

#### Agent 核心原理
- **ReAct 范式**：Reasoning + Acting、思考链、行动执行
- **工具调用**：工具选择策略、参数提取、结果处理
- **记忆管理**：短期记忆、长期记忆、记忆检索

#### 完整 Agent 应用
- **需求分析**：场景定义、用户画像、功能边界
- **架构设计**：技术选型、模块划分、接口设计
- **开发实现**：核心逻辑、异常处理、日志追踪
- **部署上线**：容器化、CI/CD、监控告警

### 4. 进阶层

探索前沿技术，参与社区贡献。

#### 多智能体系统
- **协作模式**：主从模式、对等模式、层级模式
- **任务分解**：任务规划、子任务分配、结果聚合
- **通信机制**：消息传递、共享状态、事件驱动

#### RAG 技术
- **文档处理**：解析、清洗、分块策略
- **向量检索**：Embedding 模型、向量数据库、相似度搜索
- **混合搜索**：关键词 + 向量、重排序、结果融合

#### 模型微调
- **数据准备**：数据采集、清洗、格式转换
- **训练流程**：Fine-tuning、LoRA、PEFT
- **评估优化**：指标定义、A/B 测试、持续迭代

## 前端优势发挥

### 可直接迁移的能力

| 前端技能 | AI 全栈应用 |
|----------|-------------|
| TypeScript | LangChain.js、类型安全的 Agent 开发 |
| async/await | 流式响应、并发调用、错误处理 |
| React/Vue | Agent UI、对话界面、可视化编排 |
| Node.js | 后端服务、API 开发、中间件 |
| 状态管理 | Agent 状态、记忆管理、会话追踪 |

### 需要重点学习

- **Python 基础**：AI 生态主力语言，部分场景必须
- **向量数据库**：Embedding 存储与检索
- **模型原理**：理解限制才能设计好 Prompt
- **后端架构**：分布式、消息队列、缓存策略

## 学习资源

### 官方文档
- [LangChain.js Docs](https://js.langchain.com/)
- [LangGraph.js Docs](https://langchain-ai.github.io/langgraphjs/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)

### 实践项目
- 构建个人 AI 助手
- 开发代码审查 Agent
- 实现多 Agent 协作系统

---

> 💡 **学习建议**：不必按顺序学完所有内容，边学边做项目效果最佳。遇到不懂的概念再回头补基础。
