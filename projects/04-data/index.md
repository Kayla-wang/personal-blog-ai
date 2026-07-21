---
title: 数据智能体项目
sidebar_position: 4
tags: [数据智能体, Text-to-SQL, 数据可视化, 项目]
---

# 数据智能体项目

> 三个模块分别对应「理数据 / 问数据 / 看数据」

## 主题主线

```
自动标签化(清洗/丰富) ──> Text-to-SQL(查询) ──> 数据可视化(呈现)
     reviews 打标           查 orders/products      结果画成图
```

三者可以组合成一个完整的「对话式 BI / Data Analyst Agent」：先把原始评价数据清洗打标，再让用户用自然语言查询结构化数据，最后把查询结果自动画成图表呈现。

## 共享数据集（电商订单）

后续三个模块共用同一套电商订单数据集，统一 schema 如下：

| 表 | 说明 | 关键字段 |
|----|------|----------|
| `users` | 用户 | id, name, city, register_date |
| `products` | 商品 | id, name, category, price |
| `orders` | 订单 | id, user_id, product_id, quantity, amount, created_at |
| `reviews` | 评价 | id, product_id, user_id, content, rating, created_at |

## 项目目录

| 项目 | 难度 | 技术栈 | 预计时间 |
|------|------|--------|----------|
| [数据自动标签化](./01-auto-labeling.md) | ⭐⭐⭐ | LangChain.js + zod | 2 周 |
| [Text-to-SQL](./02-text-to-sql.md) | ⭐⭐⭐ | LangChain.js + SQLite | 3 周 |
| [数据可视化](./03-data-viz.md) | ⭐⭐⭐ | Vercel AI SDK + ECharts | 3 周 |
