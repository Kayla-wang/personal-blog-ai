---
title: 语义建模:给数据一本"业务词典"
sidebar_position: 2
tags: [语义层, 语义建模, 可加性]
---

# 语义建模:给数据一本"业务词典"

上一篇说,裸 Text2SQL 不靠谱的根源是把「理解业务」这件事丢给了模型去猜。语义层的作用,就是把这些「该怎么理解」的知识**预先固化下来**,让模型只做它擅长的事(理解自然语言意图),把口径、聚合这些容易错的部分交给确定性的引擎。

这一篇讲怎么写这本「业务词典」—— 语义模型。

## 一、语义层要解决的矛盾:物理事实 vs 业务概念

数据库里存的是**物理事实**:一张 `orders` 表,有 `amount`、`user_id`、`region` 这些列。而业务同学脑子里想的是**业务概念**:「销售额」「客单价」「活跃用户」「华东区」。

这两者之间存在一层需要翻译的鸿沟:

- 「销售额」→ `SUM(amount)`
- 「客单价」→ `SUM(amount) / COUNT(id)`
- 「活跃用户」→ `COUNT(DISTINCT user_id)`
- 「华东」→ `region = '华东'`

裸 Text2SQL 让模型每次现场翻译,语义层则把这本翻译词典写死。

## 二、语义模型四要素

mini-SuperSonic 用一个 YAML 文件描述语义模型。下面是完整的 `semantic-model.yaml`:

```yaml
entities:
  order: { table: orders, primary_key: id }

dimensions:
  region:   { expr: region, values: [华东, 华南, 华北, 西南] }
  category: { expr: category }
  month:    { expr: month, type: time }

measures:
  gmv:          { expr: "SUM(amount)",             additivity: full }
  order_count:  { expr: "COUNT(id)",               additivity: full }
  active_users: { expr: "COUNT(DISTINCT user_id)", additivity: none }
  avg_order_value:
    type: ratio
    numerator: "SUM(amount)"
    denominator: "COUNT(id)"
    additivity: none

synonyms:
  华东: [华东区, 长三角]
  gmv: [销售额, 成交额, 卖得好]
  active_users: [活跃用户, 活跃用户数, 下单用户数]
  avg_order_value: [客单价, 平均订单金额]
  category: [品类, 类目]
  region: [地区, 区域]
  month: [月份]
```

它包含四类要素:

- **实体(entities)**:业务对象对应的物理表。这里只有一个 `order`,映射到 `orders` 表。
- **维度(dimensions)**:用来「分组/过滤」的字段,如地区、品类、月份。`region` 还声明了合法取值白名单 `values`,后面校验会用到。
- **度量(measures)**:可聚合的业务指标,如 GMV、订单数。每个度量绑定一个聚合表达式 `expr`。
- **同义词(synonyms)**:自然语言里同一个概念的多种说法,如「销售额/成交额」都指向 `gmv`。

## 三、核心概念:可加性(additivity)

四要素里最值得单独讲的是度量的 `additivity`(可加性)—— 它是区分「靠谱语义层」和「玩具」的关键。

**可加性**指的是:一个指标在不同维度上拆开后,能不能简单相加还原成总量。看三个真实指标:

### full:可加(gmv、order_count)

```yaml
gmv: { expr: "SUM(amount)", additivity: full }
```

GMV 是金额求和。华东的 GMV + 华南的 GMV + …… = 全国 GMV,分品类拆开再加也一样。这类指标可以放心地按任意维度拆分再汇总。

### none — 去重计数不可加(active_users)

```yaml
active_users: { expr: "COUNT(DISTINCT user_id)", additivity: none }
```

「活跃用户」是**去重**用户数。一个用户可能同时在「数码」和「服饰」下单,那么:

```
数码的活跃用户数 + 服饰的活跃用户数  ≠  两品类合计的活跃用户数
```

因为这个用户被两个品类各数了一次,相加会**重复计数**。所以去重指标按维度拆开再相加是错的。

### none — 比率不可加(avg_order_value)

```yaml
avg_order_value:
  type: ratio
  numerator: "SUM(amount)"
  denominator: "COUNT(id)"
  additivity: none
```

客单价是「总金额 / 总订单数」。经典陷阱是「平均的平均」:

```
(华东客单价 + 华南客单价) / 2  ≠  两地区合并后的客单价
```

正确算法必须回到分子分母各自求和再相除。所以比率指标也标记为 `none`,并且用 `numerator`/`denominator` 显式描述,而不是给一个 `expr`。

把可加性写进语义模型后,校验器(第 04 篇)就能拦住「对不可加指标做多维度拆分」这类静默错误 —— 这是纯靠大模型很难稳定避免的。

## 四、同义词与 Knowledge Base

光有 YAML 还不够,得有个运行时对象把它加载进内存、并支持「一个词能不能识别」的查询。这就是 Knowledge Base。核心方法是 `resolveTerm`,来自 `src/knowledge-base.ts`:

```ts
export class KnowledgeBase {
  private syn = new Map<string, string>(); // 同义词 → 规范名
  constructor(private _model: SemanticModel) {
    for (const [canonical, aliases] of Object.entries(_model.synonyms ?? {})) {
      for (const a of aliases) this.syn.set(a, canonical);
    }
  }
  get model(): SemanticModel { return this._model; }

  resolveTerm(term: string): Resolved | null {
    const canonical = this.syn.get(term) ?? term;
    if (this._model.measures[canonical]) return { kind: 'metric', name: canonical };
    if (this._model.dimensions[canonical]) return { kind: 'dimension', name: canonical };
    for (const [dim, def] of Object.entries(this._model.dimensions)) {
      if (def.values?.includes(canonical)) return { kind: 'value', name: canonical, dimension: dim };
    }
    return null;
  }
}
```

它做两件事:

1. **构造时**把 `synonyms` 反向展开成「别名 → 规范名」的 Map,例如 `长三角 → 华东`、`销售额 → gmv`。
2. **查询时** `resolveTerm` 先把词归一化到规范名,再判断它是指标、维度,还是某个维度的取值。

于是:

- `resolveTerm('销售额')` → 归一化到 `gmv` → 命中 measures → `{ kind: 'metric', name: 'gmv' }`
- `resolveTerm('长三角')` → 归一化到 `华东` → 命中 region 的取值白名单 → `{ kind: 'value', name: '华东', dimension: 'region' }`
- `resolveTerm('不存在的词')` → `null`

这个「词 → 语义角色」的解析能力,是下一篇 Schema Mapper 的地基。

## 小结

语义模型是整个 Chat BI 的地基:实体/维度/度量/同义词描述「有什么」,可加性描述「能怎么算」。把这些知识固化下来,后面的 Parser、Corrector、Translator 才有共同的「事实来源」可依赖 —— 模型不再需要猜口径,引擎按定义执行即可。

下一篇进入链路:看一句话怎么一步步变成 SQL。
