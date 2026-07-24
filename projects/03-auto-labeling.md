---
title: 数据自动标签化
sidebar_position: 3
tags: [数据标签化, 结构化输出, LLM]
---

# 数据自动标签化

> 把原始文本交给 LLM，按预定义分类体系打标，产出结构化字段

## 项目概述

### 功能范围

- **分类打标**：原始文本 → 情感 / 问题分类 → 结构化输出
- **批量处理**：成百上千条记录的并发打标，控制速率与成本
- **置信度判定**：模型给出置信度，低置信样本转人工复核
- **人工复核回环**：复核结果反哺 taxonomy 与 few-shot 样例，持续提升准确率

### 技术栈

- 运行时：Node.js + LangChain.js
- 结构化输出：zod（约束模型输出必须是合法的分类结果）
- 模型：OpenAI 兼容接口（Chat Completions / function calling）

落地场景：给电商 `reviews.content` 打「情感 + 问题分类」标签，产出可直接入库查询的结构化字段。

## 架构设计

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ reviews 原始  │────>│ 预处理 / 分批 │────>│      LLM 打标          │
│  content     │     │ (去重/清洗)   │     │  taxonomy + zod schema│
└──────────────┘     └──────────────┘     └───────────┬───────────┘
                                                        │
                                                        ▼
                                            ┌───────────────────────┐
                                            │      置信度判定         │
                                            └───────────┬───────────┘
                                       ┌─────────────────┴─────────────────┐
                                       ▼                                   ▼
                              置信度低 (< 阈值)                     置信度高 (>= 阈值)
                                       │                                   │
                                       ▼                                   ▼
                            ┌───────────────────┐               ┌───────────────────┐
                            │     人工复核        │               │  写回结构化字段     │
                            │ (标注平台 / 抽样)    │               │ sentiment/category │
                            └─────────┬─────────┘               └───────────────────┘
                                      │
                                      ▼
                          复核结果反哺 taxonomy / few-shot 样例
```

## 核心功能

### 1. taxonomy 定义与 zod schema

```typescript
import { z } from 'zod';

// 预定义分类体系：情感三分类 + 问题四分类
const SentimentEnum = z.enum(['正', '负', '中']);
const CategoryEnum = z.enum(['物流', '质量', '客服', '价格']);

// 约束模型必须返回这个结构，避免自由文本导致解析失败
const LabelResultSchema = z.object({
  sentiment: SentimentEnum.describe('评价的情感倾向'),
  category: CategoryEnum.describe('评价涉及的主要问题分类'),
  confidence: z.number().min(0).max(1).describe('模型对本次判断的置信度，0-1'),
  reason: z.string().optional().describe('简要判断依据，便于人工复核时参考'),
});

type LabelResult = z.infer<typeof LabelResultSchema>;
```

### 2. 单条打标函数

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

async function labelReview(review: {
  id: number;
  content: string;
}): Promise<LabelResult> {
  const structuredModel = model.withStructuredOutput(LabelResultSchema);

  const prompt = `
你是电商评价标注专家，请根据以下分类体系对评价内容打标：

情感分类：正 / 负 / 中
问题分类：物流（配送/包装）/ 质量（商品本身）/ 客服（服务态度/响应）/ 价格（性价比/定价）

评价内容：
"""
${review.content}
"""

请给出 sentiment、category、confidence（0-1）和简要 reason。
`;

  return structuredModel.invoke(prompt);
}
```

### 3. 批量处理与并发控制

```typescript
interface Reviews {
  id: number;
  product_id: number;
  user_id: number;
  content: string;
  rating: number;
  created_at: string;
}

const CONFIDENCE_THRESHOLD = 0.7;
const CONCURRENCY = 5;

async function batchLabel(reviews: Reviews[]) {
  const results: Array<{ reviewId: number; label: LabelResult }> = [];

  for (let i = 0; i < reviews.length; i += CONCURRENCY) {
    const batch = reviews.slice(i, i + CONCURRENCY);

    const labeled = await Promise.all(
      batch.map(async (review) => {
        try {
          const label = await labelReview(review);
          return { reviewId: review.id, label };
        } catch (err) {
          // 单条失败不影响整批，记录后续重试
          console.error(`review ${review.id} 打标失败`, err);
          return null;
        }
      })
    );

    for (const item of labeled) {
      if (!item) continue;
      results.push(item);

      // 低置信样本转人工复核队列，高置信直接写回
      if (item.label.confidence < CONFIDENCE_THRESHOLD) {
        await enqueueForReview(item);
      } else {
        await writeBackLabel(item);
      }
    }
  }

  return results;
}
```

## 关键技术点

### taxonomy 设计：预定义 vs 自动发现

- **预定义**（本项目采用）：由业务方事先定义好情感三分类、问题四分类，模型只在固定枚举内选择。优点是结果可控、易于下游统计聚合；缺点是遇到体系外的新问题类型（如"尺码"）会被强行归到最接近的已有类别，需要定期审视 taxonomy 是否需要扩充。
- **自动发现**：先用 LLM 或聚类算法对样本做无监督归纳，发现潜在类别簇，再人工提炼为正式 taxonomy。适合冷启动阶段没有先验分类体系的场景，通常作为预定义 taxonomy 上线前的一次性探索步骤，而非长期在线流程。

### 结构化输出约束

用 `withStructuredOutput` + zod schema（底层依赖 function calling / JSON mode）强制模型输出符合枚举与类型的结构，避免自由文本导致下游解析报错。zod 的 `.enum()` 直接把 taxonomy 编码进 schema，模型选错分类会在 API 层被拒绝或自动修正，比"prompt 里说清楚 + 正则提取"更可靠。

### 批量与成本控制

- 用固定并发窗口（如一次 5 条）遍历，而不是无限制 `Promise.all`，避免触发速率限制或瞬时费用尖峰。
- 对长文本先做去重/长度截断，减少无效 token 消耗。
- `temperature: 0` 保证同一输入结果稳定，便于重试和缓存命中。
- 可对已打标内容做哈希缓存，重复评价（如模板化差评）跳过重复调用。

### 置信度 + human-in-the-loop 复核回环

模型返回的 `confidence` 是判定是否需要人工介入的关键信号：高于阈值直接写回结构化字段，低于阈值进入复核队列。人工复核的结果不是一次性消耗品——把复核后的正确标签整理成 few-shot 样例，或反过来修订 taxonomy 定义本身，可以持续提高后续自动打标的准确率，形成闭环。

## 实现步骤

1. **定义 taxonomy**：与业务方对齐情感分类、问题分类的枚举值和边界
2. **写 zod schema**：把 taxonomy 编码为结构化输出约束
3. **实现打标函数**：单条 review 打标，包含 prompt 设计与结果解析
4. **实现批处理**：并发窗口 + 失败重试 + 成本控制
5. **搭建复核回环**：低置信样本入队、人工标注、结果回写与 few-shot 样例更新

## 进阶功能

- [ ] 主动学习：优先把模型最不确定的样本挑给人工标注，提升标注性价比
- [ ] few-shot 自举：用已确认的高质量标注样本反哺 prompt，减少低置信比例
- [ ] 标注一致性评估：多模型/多次调用交叉验证，度量标注结果的稳定性
