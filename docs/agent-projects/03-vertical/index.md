---
title: 垂类智能体项目
sidebar_position: 1
tags: [垂类智能体, 领域专家, 项目]
---

# 垂类智能体项目

> 注入特定领域知识与规则，专注解决某一行业或领域问题的智能体

## 核心特点

- **领域专业性强**：深度理解特定领域
- **准确率要求高**：错误代价大，需要高精度
- **定制化程度高**：针对具体业务场景优化
- **需要领域知识**：依赖专业知识库和规则

## 项目列表

| 项目 | 难度 | 核心技术 | 学习重点 |
|------|------|----------|----------|
| [代码助手](./01-code-assistant/) | ⭐⭐⭐ | LangChain.js + AST | 代码理解、上下文工程 |
| [医疗问诊助手](./02-medical-assistant/) | ⭐⭐⭐⭐ | RAG + 知识图谱 | 安全边界、合规性 |
| [金融分析助手](./03-finance-assistant/) | ⭐⭐⭐⭐ | 数据分析 + 可视化 | 可解释性、合规要求 |
| [教育辅导助手](./04-education-assistant/) | ⭐⭐⭐ | 自适应学习 + 评估 | 个性化、知识追踪 |

## 垂类 vs 通用

| 维度 | 通用智能体 | 垂类智能体 |
|------|-----------|-----------|
| 知识范围 | 广而浅 | 窄而深 |
| 准确率 | 中等 | 高 |
| 定制成本 | 低 | 高 |
| 适用场景 | 日常任务 | 专业场景 |

## 技术要点

### 1. 领域知识注入

```
方法一：RAG（检索增强）
└── 构建领域知识库 → 向量化 → 检索相关内容 → 增强 Prompt

方法二：知识图谱
└── 实体抽取 → 关系建模 → 图数据库 → 推理查询

方法三：微调
└── 领域数据收集 → 格式转换 → Fine-tuning → 评估
```

### 2. 准确性保障

- **多源验证**：交叉验证多个信息源
- **置信度评估**：输出不确定性估计
- **人工审核**：关键决策人工复核
- **持续反馈**：收集错误案例迭代

### 3. 安全与合规

| 领域 | 关键约束 |
|------|----------|
| 医疗 | 不提供诊断建议，免责声明 |
| 金融 | 投资风险提示，合规审查 |
| 法律 | 不构成法律建议，地域限制 |
| 教育 | 内容审核，年龄适配 |

## 设计模式

### 领域专家 + 审核员模式

```
用户输入 → 领域专家 Agent → 审核员 Agent → 输出
              ↓                  ↓
          生成回答            检查合规性
          引用来源            标注风险
```

### 多专家会诊模式

```
           ┌─────────────┐
           │   Router    │
           └──────┬──────┘
      ┌──────────┼──────────┐
      ↓          ↓          ↓
 ┌─────────┐┌─────────┐┌─────────┐
 │ Expert1 ││ Expert2 ││ Expert3 │
 └────┬────┘└────┬────┘└────┬────┘
      └──────────┼──────────┘
                 ↓
           ┌──────────┐
           │ Ensemble │
           └──────────┘
```

## 参考开源项目

### 代码助手类

| 项目 | 简介 | Star | 特点 |
|------|------|------|------|
| [OpenHands](https://github.com/All-Hands-AI/OpenHands) | AI 软件工程代理（原 OpenDevin） | 40k+ | 完整开发环境、多模态 |
| [Aider](https://github.com/paul-gauthier/aider) | 终端 AI 编程助手，Git 集成 | 22k+ | 轻量、实用、增量编辑 |
| [Continue](https://github.com/continuedev/continue) | VS Code/JetBrains AI 编程插件 | 20k+ | IDE 深度集成 |
| [Cline](https://github.com/cline/cline) | VS Code AI 编程助手（原 Claude Dev） | 18k+ | 自主任务执行 |
| [SWE-agent](https://github.com/princeton-nlp/SWE-agent) | 自动解决 GitHub Issue 的代理 | 14k+ | 学术研究、SWE-bench |

### 知识库 / RAG 类

| 项目 | 简介 | Star | 特点 |
|------|------|------|------|
| [FastGPT](https://github.com/labring/FastGPT) | 知识库问答系统，可视化编排 | 20k+ | 中文友好、工作流 |
| [Quivr](https://github.com/QuivrHQ/quivr) | AI 第二大脑，多格式文档支持 | 36k+ | 简洁易用 |
| [PrivateGPT](https://github.com/zylon-ai/private-gpt) | 本地私有化文档问答 | 54k+ | 隐私优先、本地部署 |
| [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | 全能型私有文档 LLM 应用 | 28k+ | 多模型支持 |
| [RAGFlow](https://github.com/infiniflow/ragflow) | 深度文档理解的 RAG 引擎 | 25k+ | 文档解析强、中文优化 |

### 多模态 / 专业领域

| 项目 | 简介 | Star | 特点 |
|------|------|------|------|
| [Open Interpreter](https://github.com/OpenInterpreter/open-interpreter) | 本地代码解释器，自然语言操作电脑 | 55k+ | 多模态、系统交互 |
| [MetaGPT](https://github.com/geekan/MetaGPT) | 多 Agent 软件公司模拟 | 45k+ | 角色分工、软件工程流程 |
| [ChatDev](https://github.com/OpenBMB/ChatDev) | 多 Agent 虚拟软件公司 | 26k+ | 学术研究、流程可视化 |
| [TaskWeaver](https://github.com/microsoft/TaskWeaver) | 微软数据分析 Agent 框架 | 5k+ | 代码优先、数据分析 |

### 学习建议

- **代码助手入门**：Aider 代码简洁，适合学习核心逻辑
- **完整产品参考**：FastGPT / Dify 架构完善，适合生产参考
- **前沿研究**：SWE-agent / MetaGPT 代表学术界最新进展

## 学习建议

1. **先选一个领域深耕**：不要同时做多个垂类
2. **重视数据质量**：垂直领域数据难获取，要珍惜
3. **与领域专家合作**：技术 + 专业缺一不可
4. **持续迭代**：收集反馈，不断优化
