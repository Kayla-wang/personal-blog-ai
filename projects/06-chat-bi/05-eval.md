---
title: 验证:用评测集抓"静默错误"
sidebar_position: 5
tags: [Chat BI, 评测, 静默错误]
---

# 验证:用评测集抓"静默错误"

整个系列反复强调一件事:Chat BI 最危险的是**静默错误** —— 能跑通、有结果、但结论错。前面的语义层和纠错循环挡住了一部分,但还有一类错误连 Corrector 都判不了:模型选了一个「合法但不对」的指标。这一篇讲怎么用评测集把它们揪出来。

## 一、两层验证回顾

到目前为止,系统有两层验证:

| 层次 | 手段 | 能判什么 | 判不了什么 |
| --- | --- | --- | --- |
| 分步透明输出 | Pipeline 打印每步中间产物 | 流程「通不通」、人肉能看出的离谱 | 需要人盯着,不能自动化 |
| 规则校验 | Corrector 四条规则 | 指标/维度/取值是否合法、可加性 | 「合法但选错指标」这类逻辑错 |

举例:用户问「有多少订单」,模型选了 `active_users`(活跃用户数)而不是 `order_count`。两个都是合法指标,Corrector 挑不出毛病,SQL 跑得通,返回一个数 —— 但它答非所问。这就是规则判不了的静默错误。

## 二、为什么需要评测集

问题的本质:**逻辑对错没有自动验证信号**。「这个问题该用哪个指标」是业务判断,不是语法规则能覆盖的。

既然没有天然的验证信号,那就**人为造一个** —— 预先固定一批问题和它们的期望答案,组成黄金样本集(golden set)。每次改动后自动跑一遍,比对实际输出和期望,就得到一个可量化的准确率。这是把「主观的对错」转化成「可回归的信号」的标准做法。

## 三、评测集怎么建

黄金样本集 `eval/golden.jsonl`,每行一个样本:

```jsonl
{"question": "各品类销售额最高的是哪个", "metric": "gmv", "check": {"field": "category", "value": "家居"}}
{"question": "华东区总成交额", "metric": "gmv"}
{"question": "一共有多少订单", "metric": "order_count"}
{"question": "各地区的活跃用户数", "metric": "active_users"}
{"question": "客单价是多少", "metric": "avg_order_value"}
{"question": "华南和华北的销售额", "metric": "gmv"}
{"question": "食品类目卖了多少钱", "metric": "gmv"}
{"question": "按月份看成交额", "metric": "gmv"}
{"question": "各品类的订单量", "metric": "order_count"}
{"question": "华东区平均订单金额", "metric": "avg_order_value"}
```

每个样本包含:**问题** + **期望指标** + **可选的结果检查**(`check`)。评分逻辑抽在 `src/eval.ts` 的 `scoreOne` 里,便于单测:

```ts
export function scoreOne(result: PipelineResult, g: Golden): { pass: boolean; reason: string } {
  if (result.query.metric !== g.metric) {
    return { pass: false, reason: `指标应为 ${g.metric},实际 ${result.query.metric}` };
  }
  if (g.check) {
    const actual = String(result.rows[0]?.[g.check.field]);
    if (actual !== g.check.value) {
      return { pass: false, reason: `${g.check.field} 应为 ${g.check.value},实际 ${actual}` };
    }
  }
  return { pass: true, reason: 'ok' };
}
```

它先比对指标选对没有(这正是 Corrector 判不了的那一层),再对有 `check` 的样本比对具体结果值。

一个建模细节:**只有结果稳定唯一的问题才加 `check`**。「各品类销售额最高」在造数里家居稳定最高,可以 check;而 `order_count` 各品类相等(seed 数据保证),加 check 会因并列而不稳定,所以那类样本只校验 `metric`。评测集本身也要避免引入假阴性。

## 四、一次真实的评测输出

跑 `npm run eval`,输出每条结果和总准确率:

```
✓ 各品类销售额最高的是哪个
✓ 华东区总成交额
✓ 一共有多少订单
✓ 各地区的活跃用户数
✓ 客单价是多少
✓ 华南和华北的销售额
✓ 食品类目卖了多少钱
✓ 按月份看成交额
✓ 各品类的订单量
✓ 华东区平均订单金额

准确率: 10/10 = 100%
```

如果某条挂了,会打印失败原因,例如:

```
✗ 一共有多少订单 — 指标应为 order_count,实际 active_users
```

一眼就能看出模型把「订单数」理解成了「活跃用户数」。改了 prompt 或同义词之后重跑,就知道有没有修好、有没有引入新的回归。评测集把「凭感觉调 prompt」变成了「有数据支撑地调 prompt」。

## 五、全系列总纲

回到最开始的问题:Chat BI 到底靠什么变可靠?一句话总结:

> **Chat BI 的可靠性 = 语义层质量 × 使用者兜错能力**

- **语义层质量**决定系统「理解得准不准」:词典写得好,模型跑偏的空间就小。
- **使用者兜错能力**决定错误「传不传得到决策」:分步透明 + 评测集,让错误在到达结论前就暴露。

真正的主战场其实在**运营层** —— 持续补同义词、扩评测集、盯准确率曲线,而不是一次性把模型调好就完事。

这个简化版覆盖了核心链路,但和真实平台还有距离。没覆盖的部分可作为进阶方向:

- **多轮记忆**:「那华南呢」这类依赖上下文的追问。
- **向量检索**:词表大到无法全量塞进 prompt 时,用语义检索召回相关指标/维度。
- **权限控制**:不同用户能查的数据范围不同。
- **更复杂的语义**:跨表 join、同环比、时间粒度上卷下钻。

## 参考

- [SuperSonic](https://github.com/tencentmusic/supersonic) —— 本系列模仿的开源 Chat BI 平台,真实实现了语义层、多轮对话、插件化数据源等能力。
- 本系列的完整代码在仓库 `examples/mini-chatbi/` 目录,可 `npm install` 后独立运行 `npm run seed` / `ask` / `eval`。

简化版的意义不在于替代真实平台,而在于用最小的代码量把「为什么要有语义层、智能体循环加在哪、怎么造验证信号」这几件事讲透。理解了骨架,再看 SuperSonic 这样的完整实现,就不会迷失在细节里。
