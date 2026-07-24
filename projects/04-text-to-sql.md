---
title: Text-to-SQL
sidebar_position: 4
tags: [Text-to-SQL, 自然语言查询, LLM]
---

# Text-to-SQL

> 自然语言 → SQL → 执行 → 把结果读回成人话

## 项目概述

### 功能范围

- **NL→SQL 生成**：把用户的自然语言问题，结合 schema 与示例，转成可执行 SQL
- **执行与自纠错**：SQL 执行报错时，把错误信息回喂给模型重试，而不是直接失败
- **结果自然语言总结**：把查询结果 + 原问题交给模型，输出人能看懂的总结
- **多轮澄清**：问题存在歧义（如"最近"指哪个时间范围）时，先反问用户而不是瞎猜

### 技术栈

- 运行时：Node.js + LangChain.js
- 示例数据库：SQLite（生产场景可换成 Postgres/MySQL，只读连接）
- 模型：OpenAI 兼容接口（Chat Completions）

落地场景：让运营同学用自然语言查电商 `orders` / `products`，例如「上个月各品类销售额 Top 5」，模型生成对应 SQL 并执行，把结果整理成一句话结论。[数据自动标签化](./03-auto-labeling.md) 打好标签的 `reviews`（如 sentiment、category）同样可以被查询，例如「最近负面评价最多的品类是哪些」。

## 架构设计

```
用户问题（自然语言）
        │
        ▼
┌───────────────────────┐
│   Prompt 组装           │
│  schema/字段含义 + few-shot │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│      LLM 生成 SQL       │
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│  安全校验（只读 + 防注入）  │──── 校验不通过 ──> 直接拒绝，反馈用户
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│        执行 SQL         │
└───────────┬───────────┘
       执行报错？
      ┌─────┴─────┐
      ▼           ▼
     是           否
      │           │
      │   ┌───────────────┐
      │   │  查询结果       │
      │   └───────┬───────┘
      │           ▼
      │   ┌───────────────┐
      │   │ LLM 结果回读为   │
      │   │  自然语言总结    │
      │   └───────────────┘
      │
      ▼
把错误信息回喂给 LLM，
重新生成 SQL（限制重试次数）
      │
      └──────> 回到「安全校验」
```

## 核心功能

### 1. schema 注入 + few-shot prompt

```typescript
// schema 定义：不只是表结构，还要给出字段含义，帮模型理解业务语义
const SCHEMA_DESCRIPTION = `
表 users（用户）：
  id INTEGER, name TEXT, city TEXT, register_date TEXT

表 products（商品）：
  id INTEGER, name TEXT, category TEXT -- 商品品类，如"美妆"/"数码"
  , price REAL -- 单价，单位元

表 orders（订单）：
  id INTEGER, user_id INTEGER, product_id INTEGER
  , quantity INTEGER -- 购买数量
  , amount REAL -- 订单实付金额，单位元
  , created_at TEXT -- 下单时间，格式 YYYY-MM-DD

表 reviews（评价，含打标结果）：
  id INTEGER, product_id INTEGER, user_id INTEGER, content TEXT
  , rating INTEGER, sentiment TEXT -- 正/负/中，见「数据自动标签化」
  , category TEXT -- 物流/质量/客服/价格
  , created_at TEXT
`;

// few-shot：给模型示范 SQL 风格（表连接方式、日期过滤写法等）
const FEW_SHOT_EXAMPLES = `
问题：上个月各品类销售额 Top 5
SQL：
SELECT p.category, SUM(o.amount) AS total_amount
FROM orders o
JOIN products p ON p.id = o.product_id
WHERE o.created_at >= date('now', 'start of month', '-1 month')
  AND o.created_at < date('now', 'start of month')
GROUP BY p.category
ORDER BY total_amount DESC
LIMIT 5;

问题：最近负面评价最多的品类
SQL：
SELECT category, COUNT(*) AS negative_count
FROM reviews
WHERE sentiment = '负'
  AND created_at >= date('now', '-30 day')
GROUP BY category
ORDER BY negative_count DESC;
`;

function buildPrompt(question: string): string {
  return `
你是一名 SQLite 只读查询生成助手，只能生成 SELECT 语句，不允许生成任何写操作。

数据库 schema：
${SCHEMA_DESCRIPTION}

参考示例：
${FEW_SHOT_EXAMPLES}

请把下面的问题转成一条 SQL，只输出 SQL 本身，不要附加解释：
问题：${question}
`;
}
```

### 2. 生成 + 执行 + 自纠错回环

```typescript
import Database from 'better-sqlite3';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
const db = new Database('shop.db', { readonly: true }); // 只读打开，见「安全约束」

const MAX_RETRIES = 3;

async function generateAndRun(question: string): Promise<{
  sql: string;
  rows: Record<string, unknown>[];
}> {
  let prompt = buildPrompt(question);
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // 如果是重试，把上一次的错误信息拼进 prompt
    const currentPrompt = lastError
      ? `${prompt}\n\n上一次生成的 SQL 执行报错：${lastError}\n请修正后重新生成。`
      : prompt;

    const response = await model.invoke(currentPrompt);
    const sql = extractSql(response.content as string);

    assertReadOnlyAndSafe(sql); // 只读 + 防注入校验，见下方安全约束

    try {
      const rows = db.prepare(sql).all() as Record<string, unknown>[];
      return { sql, rows }; // 成功，直接返回
    } catch (err) {
      // 执行报错：记录错误信息，回喂给下一轮生成，而不是直接抛出
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_RETRIES) {
        throw new Error(`SQL 执行连续失败 ${MAX_RETRIES + 1} 次：${lastError}`);
      }
    }
  }

  throw new Error('unreachable');
}

function extractSql(text: string): string {
  // 模型偶尔会包一层 ```sql 代码块，去掉围栏只留 SQL 本体
  return text.replace(/```sql|```/g, '').trim();
}
```

### 3. 结果回读为自然语言

```typescript
async function summarizeResult(
  question: string,
  sql: string,
  rows: Record<string, unknown>[]
): Promise<string> {
  // 结果行数可能很多，截断后再交给模型，避免 prompt 过长
  const preview = rows.slice(0, 20);

  const prompt = `
用户的问题：${question}
执行的 SQL：${sql}
查询结果（最多展示前 20 行，共 ${rows.length} 行）：
${JSON.stringify(preview, null, 2)}

请用简洁的自然语言总结结果，直接回答用户的问题，
如果结果为空，请说明"未查到符合条件的数据"，不要编造数字。
`;

  const response = await model.invoke(prompt);
  return response.content as string;
}
```

## 关键技术点

### schema / 字段含义注入

只把表名和字段名丢给模型远远不够——`category` 是品类还是用户等级？`amount` 是含税金额还是实付金额？这些业务语义必须显式写进 prompt（如上面 schema 描述里的行内注释），否则模型会凭常识猜测字段含义，生成语义正确但结果错误的 SQL。

### few-shot 引导 SQL 风格

不给示例时，模型对日期过滤、JOIN 写法、聚合函数的选择可能与实际数据库方言不一致（例如 SQLite 的 `date('now', ...)` 和 MySQL 的 `DATE_SUB` 完全不同）。给 1-2 条贴近真实场景的问答示例，能显著提升生成 SQL 的可执行率和风格一致性。

### 执行报错自纠错回环

SQL 生成本质上是"一次成功率不到 100% 的猜测"——列名拼错、GROUP BY 缺字段、语法方言不对都很常见。与其直接把报错抛给用户，不如把数据库返回的错误信息原样回喂给模型，让它带着"上一次哪里错了"的上下文重新生成，通常 1-2 次重试就能收敛。务必设置 `MAX_RETRIES` 上限，避免模型陷入同一个错误的死循环，超过上限就明确失败并提示用户。

### 安全约束：只读 + 防 SQL 注入

Text-to-SQL 最大的风险是模型生成了破坏性语句，或者用户问题里夹带了注入意图。两层防护缺一不可：

```typescript
const FORBIDDEN_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|ATTACH|PRAGMA)\b/i;

function assertReadOnlyAndSafe(sql: string): void {
  const trimmed = sql.trim();

  if (!/^SELECT\b/i.test(trimmed)) {
    throw new Error('仅允许 SELECT 查询');
  }
  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    throw new Error('检测到禁止的关键字，拒绝执行');
  }
  if (trimmed.includes(';') && trimmed.indexOf(';') < trimmed.length - 1) {
    // 分号后面还有内容，可能是多语句注入
    throw new Error('不允许多条语句拼接执行');
  }
}
```

除了应用层的关键字过滤，数据库连接本身也要用**只读账号 / 只读模式**打开（如上面 `better-sqlite3` 的 `readonly: true`，生产环境对应数据库的只读用户或只读副本），做到"即便模型生成了危险 SQL，数据库层也拒绝执行"的双重保险。

### 结果回读为自然语言

用户想要的是答案，不是一张原始表格。把查询结果连同原始问题再丢给模型总结一遍，能把"5 行 JSON"变成"上个月销售额最高的品类是美妆，达到 12.3 万元"这样直接可用的结论。注意把结果行数截断后再传入 prompt，避免超长结果拖垮 token 消耗。

### 模糊问题多轮澄清（进阶）

像"最近"、"热门"这类模糊词，不同用户理解的时间范围、排序口径都不同。更稳妥的做法是让模型先判断问题是否有歧义，歧义明显时先反问（如"您说的'最近'是指最近 7 天还是 30 天？"），拿到澄清后再生成 SQL，而不是凭一次猜测直接执行——这也是本项目「进阶功能」重点扩展的方向。

## 实现步骤

1. **准备示例库**：SQLite 建库，导入 `users`/`products`/`orders`/`reviews` 示例数据
2. **schema 注入**：整理字段含义，写成 prompt 片段，配上 2-3 条 few-shot 示例
3. **生成 SQL**：调用模型，按 `SELECT` 前缀 + 关键字黑名单做安全校验
4. **执行与重试**：执行失败则把错误回喂模型，限制重试次数
5. **结果回读**：把最终结果与原问题交给模型，输出自然语言总结

## 进阶功能

- [ ] RAG 检索相关表/历史查询：schema 变大后，先检索与问题最相关的表和历史相似查询，而不是把全部 schema 塞进 prompt
- [ ] 语义层/指标定义：把"销售额"、"活跃用户"等业务指标预先定义好计算口径，模型直接引用指标而非现算聚合逻辑
- [ ] 多轮澄清：识别问题歧义并主动反问，结合对话历史逐步收敛到精确的查询意图
