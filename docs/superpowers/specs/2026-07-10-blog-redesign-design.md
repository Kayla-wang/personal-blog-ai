# 博客全面改版设计规范

> 日期：2026-07-10  
> 状态：已批准

## 概述

将当前的学习笔记站点进行全面改版，重新规划内容结构、首页设计和导航系统。

### 目标

- **主要用途**：个人学习笔记（理论知识 + 项目实战）
- **内容方向**：AI Agent 开发（目前只专注 AI 方向）
- **技术路线**：Python 和 Node.js 双路线并行

### 核心改动

1. 合并重复内容，建立统一的理论知识库
2. 项目实战独立成区，按智能体类型分类
3. 使用标签系统区分技术栈（Python / JavaScript / 通用）
4. 简化首页和导航，去除失效链接

---

## 内容结构

采用「理论实战分离制」，理论知识按主题组织避免重复，项目实战按智能体类型分类。

### 目录结构

```
docs/                          # 理论知识（路由：/notes）
├── 01-fundamentals/           # 基础能力
│   ├── python-basics/         # Python 基础 [Python]
│   └── nodejs-backend/        # Node.js 后端 [JS]
│
├── 02-llm-core/               # LLM 核心
│   ├── models-overview/       # 模型原理 [通用]
│   ├── api-calling/           # API 调用（含 Python/JS 示例）
│   ├── prompt-engineering/    # Prompt 工程 [通用]
│   └── model-selection/       # 模型选型 [通用]
│
├── 03-rag/                    # RAG 技术
│   ├── document-processing/   # 文档处理
│   ├── embedding/             # 向量化
│   ├── vector-database/       # 向量数据库
│   └── retrieval/             # 检索策略
│
├── 04-agent-frameworks/       # Agent 框架
│   ├── overview/              # 框架对比 [通用]
│   ├── langchain/             # LangChain [Python]
│   ├── langchain-js/          # LangChain.js [JS]
│   ├── langgraph/             # LangGraph [Python]
│   └── langgraph-js/          # LangGraph.js [JS]
│
└── 05-agent-patterns/         # Agent 设计模式 [通用]
    ├── react/
    ├── multi-agent/
    ├── memory/
    └── tool-design/

projects/                      # 项目实战（路由：/projects）
├── 01-general/                # 通用智能体
│   ├── personal-assistant/    # 个人助理
│   └── office-assistant/      # 办公助手
│
├── 02-workflow/               # 工作流智能体
│   ├── backend-automation/    # 后端自动化
│   └── approval-engine/       # 审批流程引擎
│
└── 03-vertical/               # 垂类智能体
    ├── code-assistant/        # 代码助手
    ├── finance-assistant/     # 金融助手
    └── education-assistant/   # 教育助手
```

### 内容迁移计划

| 原目录 | 目标 | 操作 |
|--------|------|------|
| `docs/ai-agent/` | `docs/` 根目录 | 重组并合并 |
| `docs/ai-fullstack/` | `docs/` 根目录 | 合并到统一结构，删除独立目录 |
| `docs/agent-projects/` | `projects/` | 迁移到独立的 projects 目录 |

---

## 首页设计

### 布局

采用极简的双卡片布局：

```
┌─────────────────────────────────────────────────────┐
│  [Logo] AI 学习笔记      理论知识 | 项目实战 | 🔍   │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Personal Learning Notes                │
│                                                     │
│              AI Agent 学习笔记                      │
│           理论知识 · 项目实战 · 持续学习            │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────────┐   ┌─────────────────┐        │
│   │ 📖 理论知识      │   │ 🔨 项目实战     │        │
│   │                 │   │                 │        │
│   │ 系统化的学习笔记 │   │ 从理论到实践    │        │
│   │ LLM / RAG /     │   │ 通过真实项目    │        │
│   │ Agent 框架      │   │ 巩固学习成果    │        │
│   │                 │   │                 │        │
│   │ Python·Node.js  │   │ 通用·工作流·垂类│        │
│   └─────────────────┘   └─────────────────┘        │
│                                                     │
├─────────────────────────────────────────────────────┤
│              专注 · 记录 · 成长                      │
└─────────────────────────────────────────────────────┘
```

### 设计要点

- 去除当前失效的 `/blog` 和 `/docs/tags` 链接
- 只保留「理论知识」和「项目实战」两个核心入口
- 导航栏精简为：Logo、理论知识、项目实战、搜索

---

## 导航系统

### 顶部导航栏

```
[Logo] AI 学习笔记    |    理论知识    |    项目实战    |    🔍
```

### 理论知识侧边栏

```
📚 基础能力
   ├── Python 基础
   └── Node.js 后端

🧠 LLM 核心
   ├── 模型原理
   ├── API 调用
   ├── Prompt 工程
   └── 模型选型

🔍 RAG 技术
   ├── 文档处理
   ├── 向量化
   ├── 向量数据库
   └── 检索策略

🤖 Agent 框架
   ├── 框架对比
   ├── LangChain
   ├── LangChain.js
   ├── LangGraph
   └── LangGraph.js

🎯 设计模式
   ├── ReAct
   ├── 多智能体
   ├── 记忆管理
   └── 工具设计
```

### 项目实战侧边栏

```
🌐 通用智能体
   ├── 个人助理
   └── 办公助手

⚙️ 工作流智能体
   ├── 后端自动化
   └── 审批流程引擎

🏢 垂类智能体
   ├── 代码助手
   ├── 金融助手
   └── 教育助手
```

---

## 标签系统

使用标签区分技术栈，避免内容重复。

### 标签定义

| 标签 | 颜色 | 用途 |
|------|------|------|
| `Python` | #3572A5 (蓝色) | Python 相关内容 |
| `JavaScript` | #f7df1e (黄色) | Node.js/JS 相关内容 |
| `通用` | 灰色 | 与语言无关的通用知识 |

### 使用方式

在文章的 frontmatter 中设置 tags：

```yaml
---
title: API 调用
tags: [Python, JavaScript, LLM]
---
```

### 应用示例

| 文章 | 标签 | 说明 |
|------|------|------|
| API 调用 | `Python` `JavaScript` | 同时包含两种语言的示例 |
| Prompt 工程 | `通用` | 与语言无关 |
| LangChain.js | `JavaScript` | 仅 JS 实现 |
| LangChain | `Python` | 仅 Python 实现 |

---

## 配置变更

### docusaurus.config.js

```javascript
const config = {
  title: 'AI 学习笔记',
  tagline: '理论知识 · 项目实战 · 持续学习',
  
  // docs 配置
  presets: [
    ['classic', {
      docs: {
        routeBasePath: 'notes',  // 理论知识路由
        sidebarPath: './sidebars.js',
      },
      blog: false,  // 保持禁用
    }],
  ],
  
  // projects 插件
  plugins: [
    ['@docusaurus/plugin-content-docs', {
      id: 'projects',
      path: 'projects',
      routeBasePath: 'projects',
      sidebarPath: './sidebarsProjects.js',
    }],
  ],
  
  // 导航栏
  themeConfig: {
    navbar: {
      title: 'AI 学习笔记',
      items: [
        { to: '/notes', label: '理论知识', position: 'left' },
        { to: '/projects', label: '项目实战', position: 'left' },
      ],
    },
  },
};
```

### 需要删除的文件/目录

- `docs/ai-agent/` — 内容重组后删除
- `docs/ai-fullstack/` — 合并后删除
- `docs/agent-projects/` — 迁移到 projects/ 后删除

---

## 实施范围

### 包含

- 内容目录重组
- 首页重新设计
- 导航栏和侧边栏配置
- 标签系统实现
- 配置文件更新

### 不包含

- 新内容创作（只迁移和重组现有内容）
- AI 聊天助手功能变更
- 部署配置变更
- 样式/主题大改（保持现有视觉风格）

---

## 验收标准

1. 首页显示双卡片布局，无失效链接
2. `/notes` 路由显示重组后的理论知识
3. `/projects` 路由显示迁移后的项目实战
4. 侧边栏按新结构组织
5. 文章标签正确显示技术栈
6. 本地搜索功能正常工作
