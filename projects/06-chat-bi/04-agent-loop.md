---
title: 加一个智能体循环:让它自己纠错
sidebar_position: 4
tags: [Agent, 智能体, 自主循环]
---

# 加一个智能体循环:让它自己纠错

前三篇搭出的是一条**流水线**:数据从 Mapper 流到 Executor,一路向前不回头。但 Parser 用的是大模型,它会犯错。这一篇给链路加上唯一的「回头」机制 —— 一个让系统自己纠错的智能体循环。

## 一、流水线 vs 智能体的分界

先厘清一个常被混用的概念。这套系统里大部分组件是**确定性流水线**:Mapper、Translator、Executor,同样的输入永远得到同样的输出,不存在「自主决策」。

真正配得上「智能体」三个字的,是**带反馈的自主循环**:系统评估自己的输出,发现不对就调整、重试,直到满足条件或放弃。mini-SuperSonic 里唯一的这种循环,发生在 Corrector 和 Parser 之间。

换句话说:**不是用了大模型就叫智能体,有「评估—反馈—重试」的闭环才叫**。

## 二、Corrector 在校验什么

循环要成立,先得有个能判断「对不对」的评估器。这就是 Corrector,来自 `src/corrector.ts`:

```ts
export function correct(q: SemanticQuery, model: SemanticModel): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const measure = model.measures[q.metric];
  if (!measure) {
    errors.push(`未知指标 "${q.metric}",可选:${Object.keys(model.measures).join('/')}`);
  }
  for (const d of q.dimensions) {
    if (!model.dimensions[d]) {
      errors.push(`未知维度 "${d}",可选:${Object.keys(model.dimensions).join('/')}`);
    }
  }
  for (const f of q.filters) {
    const dim = model.dimensions[f.field];
    if (!dim) { errors.push(`过滤字段 "${f.field}" 不是合法维度`); continue; }
    if (dim.values) {
      const vals = Array.isArray(f.value) ? f.value : [f.value];
      for (const v of vals) {
        if (!dim.values.includes(String(v))) {
          errors.push(`维度 "${f.field}" 不存在取值 "${v}",合法取值:${dim.values.join('/')}`);
        }
      }
    }
  }
  if (measure?.additivity === 'none' && q.dimensions.length > 1) {
    errors.push(`指标 "${q.metric}" 不可加,不支持按多个维度(${q.dimensions.join(',')})同时拆分`);
  }
  return { ok: errors.length === 0, errors };
}
```

四条规则,前两条抓「不存在」,后两条抓「静默错误」:

1. **指标存在**:模型选了 `sales`,但词表里只有 `gmv` —— 拦。
2. **维度存在**:模型编了个不存在的维度 —— 拦。
3. **维度取值合法**:模型填了 `region = '华中'`,而白名单里只有华东/华南/华北/西南 —— 拦掉这类**幻觉值**。
4. **可加性**:模型想按「地区 + 品类」两个维度拆 `avg_order_value`(客单价),而它是不可加指标 —— 拦掉「比率/去重跨维度拆分」这类误解。

规则 3、4 尤其关键:它们抓的不是崩溃,而是「能跑通但结论错」的静默错误。这些正是循环能修的信号 —— 报错信息里带着「该怎么改」的提示。

## 三、循环怎么搭

有了评估器,循环就是「校验失败 → 把错误喂回 Parser → 重试」。来自 `src/pipeline.ts` 的核心:

```ts
let previousQuery: SemanticQuery | undefined;
let previousErrors: string[] | undefined;

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  const query = await parse(nl, mapping, model, { llm: opts.llm, previousQuery, previousErrors });
  log(`[2] Parser (第${attempt}次) → ${JSON.stringify(query)}`);

  const { ok, errors } = correct(query, model);
  log(`[3] Corrector → ${ok ? '✓ 通过' : '✗ ' + errors.join('; ')}`);
  if (!ok) { previousQuery = query; previousErrors = errors; continue; }

  const sql = translate(query, model);
  log(`[4] Translator → ${sql}`);
  const rows = this.exec.run(sql);
  log(`[5] Executor → ${rows.length} 行`);
  return { query, sql, rows, attempts: attempt };
}
throw new Error(`纠错 ${maxRetries} 次仍未通过校验: ${previousErrors?.join('; ')}`);
```

两个要点:

- **把错误喂回 prompt**:校验失败时,把 `previousQuery` 和 `previousErrors` 传给下一次 `parse`。Parser 的 `buildPrompt` 会把上次的错误拼进提示,让模型「看到自己错在哪」再重试,而不是盲目重来。
- **停止条件**:校验通过就返回;达到 `maxRetries`(默认 3 次)仍不过就抛错。循环必须有明确的出口,否则会无限重试烧钱。

## 四、一次真实的纠错过程

跑一个会触发纠错的问题,分步输出如下(Parser 第一次选了不存在的指标,吃到错误后第二次改对):

```
[Q] 各品类销售额最高
[1] Mapper → {"metrics":["gmv"],"dimensions":["category"],"values":[]}
[2] Parser (第1次) → {"metric":"sales","dimensions":[],"filters":[]}
[3] Corrector → ✗ 未知指标 "sales",可选:gmv/order_count/active_users/avg_order_value
[2] Parser (第2次) → {"metric":"gmv","dimensions":["category"],"filters":[],"order":{"by":"gmv","dir":"desc"},"limit":1}
[3] Corrector → ✓ 通过
[4] Translator → SELECT category AS category, SUM(amount) AS gmv FROM orders GROUP BY category ORDER BY gmv DESC LIMIT 1
[5] Executor → 1 行

结果:
┌─────────┬──────────┬───────┐
│ (index) │ category │  gmv  │
├─────────┼──────────┼───────┤
│    0    │ '家居'   │ 41000 │
└─────────┴──────────┴───────┘
```

第一次模型幻觉出 `sales`,Corrector 明确告诉它「可选 gmv/order_count/…」,第二次模型据此改成 `gmv` 并补全了排序和 limit。系统自己把错纠了过来 —— 这就是循环的价值。

## 五、回到框架:什么时候该加循环

第 01 篇提过「验证信号 × 犯错代价」。循环能不能奏效,取决于**有没有明确的验证信号**:

- Corrector 的四条规则就是验证信号 —— 它能明确判定「对/错」并给出可操作的反馈。有了它,循环才有意义。
- 反过来,如果一个环节没有验证信号(比如「这个结论对业务有没有用」),硬套循环只会让模型反复输出无法判定的东西,徒增成本。

所以结论是:**有明确验证信号时才加循环,纯流水线够用时别硬加**。很多人一上来就给 LLM 套 ReAct、套多轮 agent,却没想清楚「凭什么判断它这轮做对了」。没有评估器的循环,不是智能体,是空转。

## 小结

这一篇给流水线加了唯一的「回头」:Corrector 评估 → 错误喂回 Parser → 重试。它把「模型会犯错」从一个致命问题,变成一个可自愈的小波动。

但循环只能修「规则能判定」的错。规则判不了的「逻辑对错」怎么办?下一篇讲用评测集造验证信号,抓那些连 Corrector 都放过的静默错误。
