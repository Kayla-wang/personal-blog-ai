# 前端工程师「实战入手」转 AI Agent 工程师学习路线

> 设计文档 · 2026-07-13

## 一、定位与约束

| 维度 | 结论 |
|------|------|
| 起点 | 前端工程师(熟 TypeScript / React / Node) |
| 终点 | 可求职/转岗的 AI Agent 工程师 |
| 方式 | **实战驱动**:以做项目为主线,边做边补知识,不先啃完理论 |
| 技术生态 | **JS/TS 起步 + Python 按需补强**(最大化复用前端能力) |
| 目标 | 求职/转岗(需要拿得出手的作品集 + 应对面试的知识广度) |
| 时间 | 业余充电,每周 ~10 小时,总计约 24 周(6 个月) |
| 主打项目 | 前端/浏览器自动化 Agent(差异化护城河) |

**核心逻辑**:做项目的顺序 = 面试官追问的顺序(基础对话 → RAG → 复杂规划)。广度靠 RAG 兜底,亮点靠浏览器 Agent 打差异化。

## 二、路线总览

```
阶段0 前置     项目一 热身        项目二 RAG打底      项目三 浏览器Agent(主打)   求职冲刺
~2周(20h)  →  ~4周(40h)     →  ~7周(70h)      →  ~9周(90h)             →  贯穿+最后2周
环境/最小知识   对话+工具调用      知识库问答          浏览器自动化               作品集/简历/面试
复用博客widget  流式/记忆/FC       分块/向量/重排      规划/工具/回放             mock面
```

每个项目都走完 **需求 → MVP → 工程化 → 部署 → 复盘** 的完整闭环,并配一个对标开源项目作为"活文档"来读。

## 三、阶段详解

### 阶段 0 · 前置准备(~2 周)

**目标**:分清"能迁移的"与"必须新学的",别在起点浪费时间。

- **直接迁移(不用学)**:TypeScript、async/await、SSE 流式、React 对话 UI、Node 后端基础。
- **最小必学(够用即可)**:
  - LLM 心智模型:Token、上下文窗口、temperature、Function Calling 是什么
  - 一次 API 调用:用 Vercel AI SDK 跑通 OpenAI / 通义千问 的 chat + 流式
  - Prompt 基础:System Prompt、Few-shot、结构化输出(JSON mode)
- **起手式**:读懂博客里现成的 `src/components/AIChatWidget` + `server/routes/chat.js` 的 SSE 流式实现——这是已跑通的真实代码,起点比从零高。
- **对标阅读**:BabyAGI(<200 行,看懂 Agent 核心循环)。

### 阶段 1 · 项目一:带工具调用的对话 Agent(~4 周)

对应仓库 `docs/agent-projects/01-general/01-personal-assistant`。

- **做什么**:能查天气/日历/搜索的个人助理,支持多轮记忆。
- **边做边学**:Function Calling / Tool 定义、工具路由、Buffer/Summary 记忆、意图识别。
- **技术栈**:Vercel AI SDK + LangChain.js,前端复用 React,后端 Node/Nest。
- **对标开源**:LangChain.js 官方 Agent 示例。
- **工程产出**:部署上线(可挂到现有博客域名下),README 讲清架构。
- **面试话术**:工具调用与错误重试设计、记忆如何裁剪省 token。

### 阶段 2 · 项目二:RAG 知识库问答 Agent(~7 周)—— 面试硬通货

对应 `docs/ai-agent/04-rag/` 全套。

- **做什么**:上传文档 → 问答,带引用溯源。可直接拿博客的 notes/projects 当语料。
- **边做边学(RAG 全链路,面试最高频)**:文档解析 → 分块策略 → embedding → 向量库(先用 JS 生态的 pgvector/Chroma)→ 检索 → **重排(rerank)** → 混合搜索。
- **Python 首次登场**:若用到更强的文档解析(unstructured)或 rerank 模型,用一个 Python 微服务补上,其余仍 JS。
- **对标开源**:FastGPT / RAGFlow(中文友好,文档解析与检索优化值得参考)。
- **工程产出**:tracing(LangSmith)、简单 eval 数据集、检索命中率指标。
- **面试话术**:分块大小怎么定、为什么要 rerank、如何评估检索质量。

### 阶段 3 · 项目三:浏览器自动化 Agent(~9 周)—— 差异化主打

对应 `docs/agent-projects/02-workflow/02-frontend-automation`。

- **做什么**:自然语言指挥浏览器完成任务(填表、抓取、E2E 测试生成、UI 回归)。
- **边做边学**:Playwright 深度操作、DOM/可访问性树喂给 LLM、**Plan-and-Execute / ReAct 规划**、工具设计、失败回放与自愈、视觉对比。
- **进阶**:引入 LangGraph.js 做状态机 / 循环控制;可选用 MCP 封装浏览器工具。
- **对标开源**:browser-use、Playwright MCP、OpenHands(看 agent loop 与安全边界)。
- **工程产出**:Docker 化、任务回放录制、可观测(每步截图 + 日志)、成本统计。
- **护城河**:把前端专精(DOM、选择器、测试)直接变成别人难复制的 Agent 能力,面试最亮的牌。

### 主线 · 工程化 & 求职冲刺(贯穿 + 最后 ~2 周)

- **每个项目都必做**:后端 API 设计、Docker、部署、基础 eval/tracing、成本优化——对应 `docs/ai-agent/07~09`,这是"工程师"和"调 API 的人"的分水岭。
- **作品集**:3 个项目都要有 线上 Demo + 架构图 README + 一篇复盘;浏览器 Agent 录演示视频。
- **求职材料**:简历用"前端 × Agent"定位;准备 RAG、工具调用、Agent 规划、eval 四组八股 + 项目里的真实取舍故事。
- **可选加分**:给某个对标开源项目提一个小 PR,作面试背书。

## 四、时间配比一览

| 阶段 | 周数 | 累计工时 | 关键交付 |
|------|------|----------|----------|
| 阶段 0 前置 | 2 | 20h | 环境跑通 + 读懂现有 widget |
| 项目一 对话 Agent | 4 | 40h | 上线的工具调用助理 |
| 项目二 RAG 知识库 | 7 | 70h | 带溯源的问答系统 + eval |
| 项目三 浏览器 Agent | 9 | 90h | 主打作品 + 演示视频 |
| 求职冲刺 | 2(+贯穿) | 20h | 作品集/简历/mock 面 |
| **合计** | **~24 周** | **~240h** | **3 个作品集项目** |

## 五、对标开源项目速查(来自 `docs/agent-projects/index.md`)

| 学习目标 | 推荐项目 | 用途 |
|----------|----------|------|
| Agent 基础原理 | BabyAGI | 核心循环 <200 行 |
| 完整产品架构 | Dify / FastGPT | 前后端完整可参考 |
| RAG 最佳实践 | RAGFlow / FastGPT | 文档解析、检索优化 |
| 浏览器/自动化 | browser-use / Playwright MCP | 主打项目直接对标 |
| Agent loop 与安全 | OpenHands | 规划循环、安全边界 |

## 六、待定/可调项

1. 三个项目的周数配比(是否压缩项目一、给主打项目更多时间)。
2. 主打项目是否包含 MCP 封装部分(加分但吃时间)。

---

> 备注:本文件是学习路线的**设计文档**。路线本身即为最终交付物,如需可直接提升为站点内已发布的内容页(与 `docs/ai-agent`、`docs/agent-projects` 并列)。
