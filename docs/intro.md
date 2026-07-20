---
title: 理论知识
sidebar_position: 0
slug: /
---

# 理论知识

> 面向 AI Agent 开发的系统化学习笔记，Python 与 Node.js 双路线并行。

这里按主题组织理论知识，从基础能力到 Agent 工程实践，配套的项目实战见 [项目实践](/projects)。

## 内容分类

| 分类 | 内容 |
|------|------|
| [基础能力](./01-fundamentals/python-basics/01-syntax-and-types.md) | Python 基础、Node.js 后端 |
| [LLM 核心](./02-llm-core/llm-fundamentals/01-models-overview.md) | 模型原理、API 调用、Prompt 工程、模型选型 |
| [RAG](./03-rag/01-document-processing.md) | 文档处理、分块、向量化、检索与重排 |
| [Agent 框架](./04-agent-frameworks/python-frameworks/01-langchain.md) | LangChain、LangGraph、LangChain.js、LangGraph.js 等 |
| [设计模式](./05-agent-patterns/patterns/01-single-agent.md) | 单/多 Agent、Plan-and-Execute、记忆、工具设计 |
| [后端与部署](./06-backend-deploy/01-fastapi.md) | FastAPI、Docker、云部署、流式、数据库 |
| [评估与调优](./07-evaluation/01-tracing.md) | Tracing、指标、测试集、成本优化 |
| [产品与工程](./08-product-engineering/01-conversation-design.md) | 对话设计、错误处理、安全、可观测 |

## 学习建议

- **快速启动**：LLM 核心 → Prompt 工程 → 用 TypeScript 做第一个 Agent。
- **按需补 Python**：边做项目边学，不必先系统啃完。
- **RAG 优先**：企业场景最常见，是面试与实战的硬通货。
- **框架选型**：先 LangChain 入门，再按需求学 LangGraph / Dify。
