---
title: AI Agent 开发工程师学习路线
sidebar_position: 1
tags: [AI, Agent, 学习路线]
---

# AI Agent 开发工程师学习路线

> 从前端工程师到 AI Agent 开发工程师的系统学习路径

## 学习路线图

```
阶段一：基础能力        阶段二：核心技术        阶段三：工程实践
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Python 基础 ──┐
              ├──→ Prompt 工程 ──→ Agent 框架 ──┐
LLM 基础 ────┘                                  │
                                                ├──→ 后端部署 ──→ 产品工程
              RAG 技术 ──→ Agent 设计模式 ──────┘
                                                      评估调优
```

## 模块概览

| 阶段 | 模块 | 核心内容 | 预计时间 |
|------|------|----------|----------|
| 基础 | [Python 基础](./01-python-basics/01-syntax-and-types.md) | asyncio、数据处理、包管理 | 1-2 周 |
| 基础 | [LLM 基础](./02-llm-fundamentals/01-models-overview.md) | 模型调用、参数理解、成本优化 | 1 周 |
| 核心 | [Prompt 工程](./03-prompt-engineering/01-system-prompt.md) | System Prompt、CoT、ReAct | 2 周 |
| 核心 | [RAG 技术](./04-rag/01-document-processing.md) | 文档处理、向量检索、重排序 | 2-3 周 |
| 核心 | [Agent 框架](./05-agent-frameworks/01-langchain.md) | LangChain、LangGraph、Dify | 2-3 周 |
| 核心 | [Agent 设计模式](./06-agent-patterns/01-single-agent.md) | 单/多 Agent、Memory、Tool | 2 周 |
| 工程 | [后端与部署](./07-backend-deploy/01-fastapi.md) | FastAPI、Docker、云服务 | 1-2 周 |
| 工程 | [评估与调优](./08-evaluation/01-tracing.md) | Tracing、测试、成本优化 | 1 周 |
| 工程 | [产品与工程](./09-product-engineering/01-conversation-design.md) | 对话设计、安全、观测 | 1 周 |

## 学习建议

### 前端背景的优势

- **TypeScript 能力**：可直接上手 LangChain.js、Vercel AI SDK
- **异步编程理解**：Promise/async-await 思维可迁移到 Python asyncio
- **UI/UX 敏感度**：对话流设计、用户体验优化

### 需要重点补强的能力

- Python 生态（包管理、异步、类型系统）
- 后端开发（API 设计、数据库、部署）
- AI 特有概念（Token、Embedding、向量检索）

### 推荐学习顺序

1. **快速启动**：LLM 基础 → Prompt 工程 → 用 TypeScript 做第一个 Agent
2. **深入 Python**：边做项目边学 Python，不必先系统学完
3. **RAG 实战**：企业场景最常见，优先掌握
4. **框架选型**：先 LangChain 入门，再根据需求学 LangGraph/Dify

## 学习资源

### 官方文档（优先阅读）

- [LangChain Docs](https://python.langchain.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com/)

### 实践平台

- [LangSmith](https://smith.langchain.com/) - LLM 应用调试
- [Dify](https://dify.ai/) - 可视化 Agent 编排

---

{/* TODO: 补充个人学习进度追踪 */}
