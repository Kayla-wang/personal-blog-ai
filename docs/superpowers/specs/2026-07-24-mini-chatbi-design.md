# Mini-SuperSonic:简化版 Chat BI + 语义层 设计文档

> 日期:2026-07-24
> 目标:模仿 [SuperSonic](https://github.com/tencentmusic/supersonic) 做一个能跑通、看得懂全链路的极简 Chat BI,用于理解「自然语言 → SQL」的完整链路与「智能体循环」的搭建,并产出一个系列实战文章。

## 1. 背景与目标

SuperSonic 本体是 Java 全平台,直接读代码很重。本项目用最小代码复刻它的**核心链路思想**,聚焦三件事:

1. **理解全链路**:一句话如何一步步变成 SQL 并执行(Schema Mapper → Semantic Parser → Corrector → Translator → Executor)。
2. **智能体搭建**:在链路中唯一真正需要「自主循环」的点(Corrector → Parser 自动纠错重试)动手搭一次,理解「何时该加循环 vs 纯流水线」。
3. **产出实战文章**:把链路与代码落成一个系列(5 篇),放进博客 `projects/`。

核心判断(来自前期讨论):
- Chat BI 的可靠性 = **语义层质量 × 使用者兜错能力**。
- 难点 90% 不在「让 LLM 写 SQL」,而在**语义建模**(把业务口径固化)。
- 最致命的是**静默错误**(语法对、结果错、还很可信),因为逻辑对错没有自动验证信号 —— 用**黄金样本评测集**人为造一个验证信号来抓它。

## 2. 非目标(Out of Scope)

明确不做,避免范围膨胀:
- Web UI、可视化图表(纯 CLI)。
- 权限控制(数据集/列/行级)。
- 插件系统 / 第三方工具集成(SuperSonic 的 Chat Plugin)。
- 多轮对话上下文、Chat Memory few-shot(可作为文章末尾「进阶」提及,不实现)。
- 生产级性能优化、向量检索(Schema Mapper 用规则字典即可)。

## 3. 技术栈

- **语言/运行时**:Node.js + TypeScript。
- **数据库**:SQLite(零配置,克隆即跑,与博客 `04-text-to-sql` 一致)。
- **LLM 调用**:Vercel AI SDK 的 `generateObject` + zod —— 用 schema 约束 LLM 输出,贴合「把输出关进笼子」主题,与 `05-data-viz` 栈一致。
- **配置**:语义模型用 YAML。

## 4. 整体架构与数据流

```
自然语言问题
     │
     ▼
[0] 语义模型 (semantic-model.yaml)  ← 地基,启动时加载 → 构建字典/索引 (Knowledge Base)
     │
     ▼
[1] Schema Mapper    "华东/GMV/品类" → 语义模型的 维度/指标/实体(规则:字典 + 同义词)
     │
     ▼
[2] Semantic Parser  NL + 映射结果 → 结构化「语义查询」(LLM + zod 约束输出)
     │
     ▼
[3] Semantic Corrector  校验语义查询(可加性 / 维度值合法 / 必填过滤)
     │  ✗ 不合法 ──┐  (规则校验)
     │  ✓ 合法      │
     ▼             │
[4] Semantic Translator  语义查询 → SQL(纯代码,不用 LLM,口径不会错)
     │             │
     ▼             │
[5] Executor  SQLite 执行 → 结果
                   │
        [3]✗ 回到 [2] 带错误重试 ← 「智能体循环」(最多 N 次)
```

每一步都打印**输入 + 输出**,链路本身即验证界面,也是文章素材。

## 5. 组件设计

| 组件 | 文件 | 职责 | 输入 → 输出 | 实现 |
|------|------|------|-------------|------|
| Knowledge Base | `knowledge-base.ts` | 加载语义模型,构建术语字典/同义词索引 | yaml → 内存字典 | 纯代码 |
| Schema Mapper | `mapper.ts` | 把 query 中的词映射到维度/指标/实体 | NL → 映射结果 | 规则:字典匹配 + 同义词 |
| Semantic Parser | `parser.ts` | 生成结构化语义查询 | NL + 映射 → SemanticQuery | LLM `generateObject` + zod |
| Semantic Corrector | `corrector.ts` | 校验语义查询合法性 | SemanticQuery → `{ok, errors}` | 规则校验 |
| Semantic Translator | `translator.ts` | 语义查询编译成 SQL | SemanticQuery → SQL string | 纯代码模板 |
| Executor | `executor.ts` | 执行 SQL 返回结果 | SQL → rows | better-sqlite3 |
| Pipeline | `pipeline.ts` | 串联全链路 + 分步打印 + 纠错循环 | NL → 结果 | 编排 |
| CLI | `cli.ts` | `ask <问题>` 单条 / `eval` 跑评测集 | - | - |

### SemanticQuery 结构(zod schema,Parser 的受控输出)

```ts
{
  metric: string,            // 指标名,必须存在于语义模型
  dimensions: string[],      // 分组维度
  filters: { field, op, value }[],
  order?: { by: string, dir: 'asc' | 'desc' },
  limit?: number
}
```

## 6. 语义模型格式(`semantic-model.yaml`)

项目灵魂,也是文章第 2 篇的核心。

```yaml
entities:
  order: { table: orders, primary_key: id }

dimensions:
  region:   { expr: region, values: [华东, 华南, 华北, 西南] }
  category: { expr: category }
  month:    { expr: order_month, type: time }

measures:
  gmv:          { expr: "SUM(amount)",             additivity: full }
  order_count:  { expr: "COUNT(id)",               additivity: full }
  active_users: { expr: "COUNT(DISTINCT user_id)", additivity: none }   # 不可加
  conversion:   { type: ratio, numerator: order_users, denominator: visit_users }

synonyms:
  华东: [华东区, 长三角]
  gmv:  [销售额, 成交额, 卖得好]
```

`additivity` 字段是 Corrector 拦截「去重数/比率被跨维度相加」这类静默错误的依据。

## 7. 智能体循环(核心教学点)

- 链路中 [1][4][5] 是**确定性流水线**;唯一的自主循环在 **[3] Corrector → [2] Parser**。
- 校验失败时,把 `errors` 拼进 prompt 喂回 Parser,让它重新生成,最多 `MAX_RETRIES`(默认 3)次。
- 循环的**停止条件**明确:校验通过,或达到重试上限。
- 教学价值:展示「有明确验证信号时,循环才有意义」——回应「三档 / 两因素」框架。

## 8. 数据集

电商主题,与博客既有内容(reviews / text-to-sql)一致。两张表,`seed.ts` 生成几百行假数据:

- `orders(id, user_id, region, category, amount, order_month)` —— 主表
- `events(user_id, event_type, month)` —— 支撑「活跃用户」「转化率」(去重 / 比率指标)

## 9. 验证方案

**第一层 — 分步透明输出(验证链路通不通)**:每个组件打印输入输出,一条问题跑下来终端展示完整数据流。

**第二层 — 黄金样本评测集(验证算得对不对)**:`eval/golden.jsonl`,10~20 条 `{问题, 期望SQL 或 期望答案}`。`cli eval` 批量跑,对照期望算通过率,专门抓静默错误。

## 10. 目录结构

```
examples/mini-chatbi/            ← 独立 TS 项目(自带 package.json)
├── semantic-model.yaml
├── seed.ts                      建库 + 塞数据
├── src/
│   ├── knowledge-base.ts
│   ├── mapper.ts
│   ├── parser.ts
│   ├── corrector.ts
│   ├── translator.ts
│   ├── executor.ts
│   ├── pipeline.ts
│   └── cli.ts
└── eval/golden.jsonl

projects/06-chat-bi/             ← 系列实战文章
├── 01-overview.md
├── 02-semantic-modeling.md
├── 03-pipeline.md
├── 04-agent-loop.md
└── 05-eval.md
```

需在 `docusaurus.config.js` / build 忽略 `examples/`,避免被当作站点内容。

## 11. 文章系列规划(`projects/06-chat-bi/`)

| # | 篇名 | 讲什么 | 对应代码 |
|---|------|--------|----------|
| 1 | 概述:为什么 Text2SQL 不够可靠 | Chat BI 痛点、静默错误、语义层是解法、架构图 | 项目全景 |
| 2 | 语义建模:给数据一本「业务词典」 | 维度/指标/口径/可加性/同义词 | `semantic-model.yaml` + `knowledge-base.ts` |
| 3 | 链路拆解:一句话到 SQL 的五步旅程 | 五组件 + 分步透明输出 | `mapper/parser/translator/executor.ts` |
| 4 | 加一个智能体循环:让它自己纠错 | 纠错重试、验证信号、循环 vs 流水线 | `corrector.ts` + `pipeline.ts` |
| 5 | 验证:用评测集抓「静默错误」 | 黄金样本、准确率、全系列总结 | `eval/golden.jsonl` + `cli eval` |

## 12. 建议实现顺序

1. 脚手架 + `seed.ts`(建库塞数据)+ `semantic-model.yaml`。
2. Knowledge Base → Mapper → Translator → Executor(先打通确定性主干,不含 LLM)。
3. Semantic Parser(接入 LLM + zod)。
4. Corrector + 纠错循环(pipeline 编排)。
5. CLI(`ask` / `eval`)+ 黄金样本集。
6. 系列文章 5 篇(边写边贴运行输出)。
