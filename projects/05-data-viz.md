---
title: 数据可视化
sidebar_position: 5
tags: [数据可视化, ECharts, LLM]
---

# 数据可视化

> 自然语言 + 数据 → 选图表 → 生成结构化 spec → 渲染，而不是让 LLM 直接画图

## 项目概述

### 功能范围

- **图表选型**：根据数据的维度/度量组合与用户意图，判断适合用什么图表呈现
- **生成图表 spec**：LLM 输出结构化的图表配置（ECharts option / Vega-Lite spec），而不是直接生成图片或画图代码
- **字段映射**：把查询结果的列，映射到图表的 x 轴、y 轴、series（分组）等语义槽位
- **图表解读**：配一段自然语言总结，点出图表里的关键结论，而不是让用户自己看图猜

### 技术栈

- 前端：React + ECharts（`echarts-for-react` 或原生 `echarts` 实例）
- 结构化输出：Vercel AI SDK（`generateObject`）+ zod（约束模型输出必须是合法的图表 spec）
- 模型：OpenAI 兼容接口（Chat Completions）

落地场景：把 [Text-to-SQL](./04-text-to-sql.md) 跑出来的查询结果（如"上个月各品类销售额 Top 5"）自动画成图——不需要用户额外说"帮我画个柱状图"，系统根据结果的数据形状自己判断该用什么图。

## 架构设计

```
Text-to-SQL 查询结果（列 + 行）+ 用户原始问题
                    │
                    ▼
        ┌───────────────────────┐
        │   数据形状分析          │
        │ (列类型/基数/是否含时间列) │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │   LLM 图表选型 + spec 生成 │
        │  zod 约束输出 ECharts option │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │      字段映射校验        │
        │ (x/y/series 是否存在于结果列中) │
        └───────────┬───────────┘
             校验不通过？
            ┌────┴────┐
            ▼         ▼
           是         否
            │         │
   回退到默认图表        ▼
   （表格/柱状图）  ┌───────────────────┐
                    │  React + ECharts 渲染 │
                    └─────────┬─────────┘
                              ▼
                    ┌───────────────────┐
                    │  LLM 生成自然语言解读  │
                    └───────────────────┘
```

## 核心功能

### 1. 图表选型 + spec 生成

用 zod 定义一份"受限版" ECharts option schema，把 `chartType` 也纳入约束范围，让模型在选型和生成 spec 这一步一次性完成，而不是分两次调用。

```typescript
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// 只开放几种最常用的图表类型，而不是 ECharts 全部能力
const ChartTypeEnum = z.enum(['line', 'bar', 'pie', 'scatter']);

const SeriesSchema = z.object({
  name: z.string().describe('该系列的名称，用于图例展示'),
  field: z.string().describe('对应查询结果中的列名'),
});

// 受限版 ECharts option：只描述渲染组件需要的语义信息，
// 具体的颜色、动画等细节交给渲染层的默认配置统一处理
const ChartSpecSchema = z.object({
  chartType: ChartTypeEnum.describe(
    '图表类型：趋势用 line，占比/对比用 bar 或 pie，分布用 scatter'
  ),
  title: z.string().describe('图表标题，简明概括图表内容'),
  xField: z.string().describe('x 轴对应的查询结果列名'),
  yFields: z.array(SeriesSchema).min(1).describe('y 轴度量列，可多条 series'),
  seriesField: z.string().optional().describe('可选，用于分组/分色的维度列'),
});

type ChartSpec = z.infer<typeof ChartSpecSchema>;

async function generateChartSpec(
  question: string,
  columns: string[],
  sampleRows: Record<string, unknown>[]
): Promise<ChartSpec> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ChartSpecSchema,
    prompt: `
用户的问题：${question}
查询结果列：${columns.join(', ')}
结果样例（前 3 行）：${JSON.stringify(sampleRows.slice(0, 3))}

请判断最适合展示这份数据的图表类型，并给出图表配置。
选型规则：
- 数据含时间序列列（如按天/月的日期）→ 优先 line，展示趋势
- 数据是分类占比或跨类别对比（如各品类销售额）→ bar 或 pie
- 数据是两个数值列的相关关系 → scatter
`,
  });

  return object;
}
```

### 2. 字段映射

模型给出的 `xField`/`yFields`/`seriesField` 只是列名字符串，渲染前必须校验这些列名确实存在于查询结果里，并把结果行转换成 ECharts 需要的数组结构。

```typescript
interface MappedChartData {
  categories: string[]; // x 轴刻度
  series: Array<{ name: string; data: number[] }>;
}

function mapFieldsToChartData(
  spec: ChartSpec,
  rows: Record<string, unknown>[]
): MappedChartData {
  const availableColumns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // 字段映射校验：模型给出的列名必须真实存在于查询结果中，
  // 否则说明生成的 spec 与实际数据脱节，直接抛错触发回退逻辑
  if (!availableColumns.includes(spec.xField)) {
    throw new Error(`xField "${spec.xField}" 不在查询结果列中`);
  }
  for (const y of spec.yFields) {
    if (!availableColumns.includes(y.field)) {
      throw new Error(`yField "${y.field}" 不在查询结果列中`);
    }
  }

  const categories = rows.map((row) => String(row[spec.xField]));

  const series = spec.yFields.map((y) => ({
    name: y.name,
    data: rows.map((row) => Number(row[y.field]) || 0),
  }));

  return { categories, series };
}
```

### 3. React 渲染组件

渲染层只认 `chartType` + `MappedChartData`，不感知模型是怎么生成 spec 的，职责边界清晰。

```tsx
import ReactECharts from 'echarts-for-react';

interface ChartRendererProps {
  spec: ChartSpec;
  data: MappedChartData;
}

function ChartRenderer({ spec, data }: ChartRendererProps) {
  const baseOption = {
    title: { text: spec.title },
    tooltip: { trigger: spec.chartType === 'pie' ? 'item' : 'axis' },
    legend: { bottom: 0 },
  };

  const option =
    spec.chartType === 'pie'
      ? {
          ...baseOption,
          series: [
            {
              type: 'pie',
              radius: '60%',
              data: data.categories.map((name, i) => ({
                name,
                value: data.series[0]?.data[i] ?? 0,
              })),
            },
          ],
        }
      : {
          ...baseOption,
          xAxis: { type: 'category', data: data.categories },
          yAxis: { type: 'value' },
          series: data.series.map((s) => ({
            name: s.name,
            type: spec.chartType === 'scatter' ? 'scatter' : spec.chartType,
            data: s.data,
          })),
        };

  return <ReactECharts option={option} style={{ height: 360 }} />;
}
```

## 关键技术点

### 图表选型规则

选型不是让模型"自由发挥"，而是给一套可解释的规则约束模型判断：

- **趋势** → 折线图（line）：数据里含时间序列列（按天/周/月），关注的是"随时间变化"
- **占比 / 对比** → 饼图或柱状图（pie / bar）：分类维度 + 一个度量，关注"谁更大/占多少"；类别数较多（如 > 7）时优先 bar 而非 pie，避免饼图切片过碎难以辨认
- **分布 / 相关性** → 散点图（scatter）：两个数值列之间的关系，关注"是否存在规律"

这套规则写进 prompt，让模型在给定数据形状时有据可依，而不是每次都可能给出不同答案。

### 生成结构化 spec 而非直接画图

让 LLM 直接输出图片或者一整段画图代码，既不可控也难以复用——模型可能画错坐标轴、用错图表库 API，还没法在渲染层做二次校验。改成让模型只输出**结构化的图表 spec**（本项目里是 zod 约束的 ECharts option 子集），渲染完全交给确定性的前端代码，spec 本身也可以落库、复用、做 A/B 对比。

### 字段映射

模型给出的字段名本质上是"意图"，不是"事实"——它可能拼错列名，或者在多轮对话里引用了已经不存在的列。渲染前的字段映射校验是最后一道防线：任何映射不上的字段都应该在渲染前拦截，而不是让 ECharts 拿到 `undefined` 数据静默画出一张空图。

### 图表解读（narrative）

图表本身只回答"数据长什么样"，很多用户还需要"这说明了什么"。把查询结果和生成好的图表 spec 一起交给模型，输出一段简短的解读文字（如"美妆品类销售额环比增长明显，其余品类基本持平"），配合图表一起展示，能显著降低用户的读图门槛。

### 可读性与配色

- 颜色数量应与 series/分类数量匹配，避免用同一套色板硬套所有图表，类别过多时（如 > 8）考虑合并"其他"类别或换用更适合密集分类的图表类型
- 数值轴优先从 0 开始，避免柱状图因为截断纵轴而放大差异造成误导
- 标题、图例、tooltip 都应携带业务语义（如单位"元"、"%"），而不是只显示裸数字

## 实现步骤

1. **定义 spec 结构**：用 zod 约束 ECharts option 的必要子集（chartType、title、xField、yFields、seriesField）
2. **写选型 prompt**：把图表选型规则和数据形状（列类型、样例行）交给模型生成 spec
3. **实现字段映射**：校验模型给出的字段名，转换成渲染层需要的数组结构
4. **实现渲染组件**：按 chartType 分支组装 ECharts option 并渲染
5. **加解读**：结果 + spec 一起交给模型，生成配套的自然语言总结

## 进阶功能

- [ ] 多图 dashboard 生成：一次问题拆解出多个子指标，自动排布成多图看板
- [ ] 异常高亮：图表渲染前检测数据里的异常点/突变，自动标注而不是让用户自己发现
- [ ] 解读自动化：把解读文案接入告警/日报流程，定期自动生成图表 + 解读组合推送
