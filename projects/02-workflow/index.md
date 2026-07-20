---
title: 工作流型智能体项目
sidebar_position: 1
tags: [工作流, 自动化, 项目]
---

# 工作流型智能体项目

> 按照预设逻辑或动态生成的流程执行标准化任务的智能体

## 核心特点

- **流程明确**：步骤清晰可预期
- **步骤可拆解**：任务可分解为子步骤
- **结果可预期**：输出稳定可控
- **自动化程度高**：减少人工干预

## 项目列表

| 项目 | 难度 | 核心技术 | 学习重点 |
|------|------|----------|----------|
| [后端自动化平台](./01-backend-automation.md) | ⭐⭐⭐ | Node.js + Cron | 定时任务、数据管道 |
| [前端自动化工具](./02-frontend-automation.md) | ⭐⭐⭐ | Playwright + AI | 浏览器自动化、测试生成 |
| 企业审批流程引擎(规划中) | ⭐⭐⭐⭐ | LangGraph.js + 状态机 | 流程建模、人机协作 |

## 应用场景

### 后端自动化
- 数据同步与 ETL
- 报表自动生成
- 邮件批量发送
- 定时任务调度
- 数据库备份恢复

### 前端自动化
- 表单自动填写
- 页面操作录制回放
- 测试用例自动生成
- UI 回归测试
- 截图对比检测

### 企业流程
- 审批流程自动化
- 工单智能分配
- 客户服务流程
- 入职/离职流程
- 采购报销流程

## 技术选型

| 场景 | 推荐方案 |
|------|----------|
| 定时任务 | node-cron / Bull Queue |
| 浏览器自动化 | Playwright |
| 流程编排 | LangGraph.js |
| 状态管理 | 有限状态机 (XState) |
| 消息队列 | Redis + Bull |

## 参考开源项目

| 项目 | 简介 | Star | 技术栈 |
|------|------|------|--------|
| [n8n](https://github.com/n8n-io/n8n) | 可视化工作流自动化平台，支持 400+ 集成 | 50k+ | TypeScript |
| [Flowise](https://github.com/FlowiseAI/Flowise) | 拖拽式 LangChain 流程构建器 | 32k+ | TypeScript |
| [Langflow](https://github.com/langflow-ai/langflow) | LangChain 可视化编排工具 | 35k+ | Python/React |
| [Dify](https://github.com/langgenius/dify) | LLMOps 平台，工作流 + RAG + Agent | 55k+ | Python/TypeScript |
| [Temporal](https://github.com/temporalio/temporal) | 分布式工作流编排引擎 | 12k+ | Go |
| [Prefect](https://github.com/PrefectHQ/prefect) | 数据工作流编排框架 | 17k+ | Python |

### 学习建议

- **可视化编排**：Flowise/Langflow 适合快速原型，学习流程设计思路
- **生产级部署**：n8n 架构清晰，自托管方案成熟
- **分布式任务**：Temporal 是工业级工作流引擎的标杆

## 设计原则

1. **幂等性**：同一操作多次执行结果一致
2. **可恢复**：失败后可从断点继续
3. **可观测**：每一步都有日志和状态
4. **可回滚**：支持撤销已执行的操作
