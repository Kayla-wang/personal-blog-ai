---
title: 链路拆解:一句话到 SQL 的五步旅程
sidebar_position: 3
tags: [Chat BI, Text2SQL, 架构]
---

# 链路拆解:一句话到 SQL 的五步旅程

有了语义模型这本词典,现在来看一句话怎么一步步变成 SQL。mini-SuperSonic 刻意把链路拆成五步,每步职责单一、可单独观察。

## 一、一条问题的完整旅程

跑 `npm run ask -- "华东区上月各品类销售额"`,分步输出如下(Parser 一步由大模型产出,其余为确定性步骤):

```
[Q] 华东区上月各品类销售额
[1] Mapper → {"metrics":["gmv"],"dimensions":["category"],"values":[{"dimension":"region","value":"华东"}]}
[2] Parser (第1次) → {"metric":"gmv","dimensions":["category"],"filters":[{"field":"region","op":"in","value":["华东"]}]}
[3] Corrector → ✓ 通过
[4] Translator → SELECT category AS category, SUM(amount) AS gmv FROM orders WHERE region IN ('华东') GROUP BY category
[5] Executor → 4 行

结果:
┌─────────┬──────────┬───────┐
│ (index) │ category │  gmv  │
├─────────┼──────────┼───────┤
│    0    │ '数码'   │ 11000 │
│    1    │ '服饰'   │ 21000 │
│    2    │ '食品'   │ 31000 │
│    3    │ '家居'   │ 41000 │
└─────────┴──────────┴───────┘
```

每一步的中间产物都打印出来 —— 这就是「分步透明」,使用者能看懂系统「怎么理解」这句话,而不是只拿到一个黑盒数字。

## 二、逐组件拆解

### [1] Schema Mapper —— 规则,产出「命中线索」

Mapper 不调用大模型,纯用规则:把模型里所有已知词(指标名、维度名、同义词、维度取值)拿去和问题做子串匹配,命中哪些就记下来。来自 `src/mapper.ts`:

```ts
export function mapQuery(nl: string, kb: KnowledgeBase): MappingResult {
  const m = kb.model;
  const terms = new Set<string>();
  for (const name of Object.keys(m.measures)) terms.add(name);
  for (const name of Object.keys(m.dimensions)) terms.add(name);
  for (const aliases of Object.values(m.synonyms ?? {})) aliases.forEach((a) => terms.add(a));
  for (const def of Object.values(m.dimensions)) (def.values ?? []).forEach((v) => terms.add(v));

  const result: MappingResult = { metrics: [], dimensions: [], values: [] };
  for (const term of terms) {
    if (!nl.includes(term)) continue;
    const r = kb.resolveTerm(term);
    if (!r) continue;
    if (r.kind === 'metric' && !result.metrics.includes(r.name)) result.metrics.push(r.name);
    else if (r.kind === 'dimension' && !result.dimensions.includes(r.name)) result.dimensions.push(r.name);
    else if (r.kind === 'value' && r.dimension)
      result.values.push({ dimension: r.dimension, value: r.name });
  }
  return result;
}
```

它产出的不是最终答案,而是「命中线索」—— 这句话里出现了 `gmv`、`category`、`region:华东`。这些线索接下来会注入 Parser 的 prompt,给大模型强提示,降低它跑偏的概率。

### [2] Semantic Parser —— LLM + zod,把输出关进笼子

Parser 是链路里**唯一**用大模型的地方。它拿着问题 + Mapper 线索 + 词表,让模型产出结构化的语义查询。关键在于「把输出关进笼子」—— 用 `generateObject` 配合 zod schema 强约束返回格式,来自 `src/parser.ts`:

```ts
export async function parse(
  nl: string,
  mapping: MappingResult,
  model: SemanticModel,
  opts: ParseOptions = {}
): Promise<SemanticQuery> {
  const llm = opts.llm ?? defaultLLM;
  const raw = await llm.generate(buildPrompt(nl, mapping, model, opts), SemanticQuerySchema);
  return SemanticQuerySchema.parse(raw);
}
```

模型不能自由发挥写 SQL,它只能填一个受 `SemanticQuerySchema` 约束的 JSON:选哪个 metric、哪些 dimensions、什么 filters。字段非法、结构缺失,zod 直接抛错。大模型的自由度被压缩到「填表」这一件事上。

### [3] Semantic Corrector —— 规则校验

Parser 产出的语义查询还要过一道规则校验(下一篇专门讲),校验通过才放行,不通过就触发纠错循环。

### [4] Semantic Translator —— 纯代码,口径不会错

Translator 把语义查询编译成 SQL,**全程不碰大模型**。来自 `src/translator.ts`:

```ts
export function translate(q: SemanticQuery, model: SemanticModel): string {
  const table = Object.values(model.entities)[0].table;
  const dims = q.dimensions.map((d) => `${dimExpr(d, model)} AS ${d}`);
  const select = [...dims, `${metricExpr(q.metric, model)} AS ${q.metric}`].join(', ');
  let sql = `SELECT ${select} FROM ${table}`;
  if (q.filters.length) sql += ` WHERE ${q.filters.map((f) => filterSql(f, model)).join(' AND ')}`;
  if (q.dimensions.length) sql += ` GROUP BY ${q.dimensions.map((d) => dimExpr(d, model)).join(', ')}`;
  if (q.order) sql += ` ORDER BY ${q.order.by} ${q.order.dir.toUpperCase()}`;
  if (q.limit) sql += ` LIMIT ${q.limit}`;
  return sql;
}
```

关键点:指标的聚合表达式来自语义模型的定义(`metricExpr` 去查 `measures[name].expr`),**不是模型现编的**。所以「gmv = SUM(amount)」这个口径由引擎拼,模型碰不到 —— 口径永远不会错。模型选错指标是可能的(那属于「理解错」,由 Corrector 和评测集兜),但一旦选定,SQL 的算法一定符合定义。

### [5] Executor —— 执行

Executor 拿 SQL 去 SQLite 查数返回行,一句话带过。这里用 Node 24 内置的 `node:sqlite`,零原生依赖。

## 三、为什么这样分层

这套分层的核心原则一句话:**确定性的部分用代码,不确定的部分才用 LLM,并把 LLM 的作用面压到最小**。

- Mapper、Translator、Executor:纯规则/纯代码,行为完全可预测、可单测。
- Parser:唯一的 LLM,且被 zod schema 和词表双重约束,只做「填表」。

这样一来,大模型的不确定性被隔离在一个很小的盒子里,盒子外的每一步都可以脱离模型独立测试。可靠性不再依赖「模型够聪明」,而依赖「架构够收敛」。

## 小结

五步链路里,四步是确定性的,一步是 LLM。整条链其实是一条**流水线**,数据从头流到尾,没有回头。

但真实场景里,Parser 会犯错 —— 选了不存在的指标、填了非法的维度值。这时候光靠流水线不够,需要一个「回头重试」的机制。这条链路里唯一需要「循环」的地方,就是校验失败后的重试 —— 下一篇讲这个智能体循环。
