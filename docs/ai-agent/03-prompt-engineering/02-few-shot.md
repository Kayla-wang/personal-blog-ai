---
title: Few-shot Learning
sidebar_position: 2
tags: [Prompt, Few-shot, 示例学习]
---

# Few-shot Learning

> 通过示例教会模型你想要的输出

## 概述

Few-shot Learning 是最有效的提示词技术之一：给模型几个输入-输出示例，让它学会模式。比纯文字描述更直观、更可靠。

## 核心概念

### 1. 基本形式

```python
prompt = """
将用户输入转换为 SQL 查询。

示例 1：
输入：查找所有年龄大于 30 的用户
输出：SELECT * FROM users WHERE age > 30

示例 2：
输入：统计每个部门的员工数量
输出：SELECT department, COUNT(*) FROM employees GROUP BY department

示例 3：
输入：找出薪资最高的 5 个人
输出：SELECT * FROM employees ORDER BY salary DESC LIMIT 5

现在处理：
输入：{user_input}
输出：
"""
```

### 2. 示例数量

| 数量 | 名称 | 适用场景 |
|------|------|----------|
| 0 | Zero-shot | 简单任务、模型能力足够 |
| 1-3 | Few-shot | 格式转换、简单规则 |
| 5-10 | Many-shot | 复杂模式、细微差异 |

### 3. 示例选择原则

```
1. 覆盖典型情况
2. 包含边界案例
3. 展示期望的格式
4. 保持一致的风格
```

## 实践要点

### 有效示例设计

{/* TODO: 补充实际项目的 Few-shot 示例 */}

```python
# 情感分类任务

PROMPT = """
分析文本的情感，输出 JSON 格式。

示例 1:
文本：这个产品太棒了，完全超出预期！
输出：{"sentiment": "positive", "confidence": 0.95}

示例 2:
文本：一般般吧，没什么特别的。
输出：{"sentiment": "neutral", "confidence": 0.7}

示例 3:
文本：糟糕透了，浪费钱！
输出：{"sentiment": "negative", "confidence": 0.9}

示例 4（边界情况）:
文本：虽然有点贵，但质量确实不错。
输出：{"sentiment": "positive", "confidence": 0.6}

现在分析：
文本：{text}
输出：
"""
```

### 动态示例选择

```python
def get_relevant_examples(query: str, all_examples: list, k: int = 3) -> list:
    """基于相似度选择最相关的示例"""
    # 简单方法：关键词匹配
    # 进阶方法：Embedding 相似度
    
    query_embedding = get_embedding(query)
    
    scored = []
    for example in all_examples:
        sim = cosine_similarity(query_embedding, example["embedding"])
        scored.append((sim, example))
    
    scored.sort(reverse=True)
    return [ex for _, ex in scored[:k]]
```

### 格式一致性

```python
# ❌ 示例格式不一致
"""
示例 1:
输入：xxx
输出：结果是 yyy

示例 2:
问题：aaa
答案：bbb
"""

# ✅ 统一格式
"""
示例 1:
输入：xxx
输出：yyy

示例 2:
输入：aaa
输出：bbb
"""
```

### 结合 System Prompt

```python
SYSTEM = """
你是一个 JSON 生成器。严格按照示例格式输出。
"""

USER_TEMPLATE = """
{examples}

现在处理：
输入：{input}
输出：
"""
```

## 常见问题

### Q: Few-shot 和 Fine-tuning 怎么选？

| 方面 | Few-shot | Fine-tuning |
|------|----------|-------------|
| 成本 | 低（只是 Prompt） | 高（训练费用） |
| 灵活性 | 高（随时修改） | 低（需要重新训练） |
| 效果上限 | 中 | 高 |
| 适用 | 快速原型、任务多变 | 任务固定、需要最优效果 |

### Q: 示例顺序重要吗？

有一定影响。一般建议：
- 简单示例放前面
- 与当前输入最相似的放最后
- 边界情况不要放第一个

### Q: 示例太多会怎样？

- 占用 Context Window
- 可能让模型过拟合示例
- 建议：3-5 个高质量示例 > 10 个普通示例

## 学习资源

- [Few-shot Prompting Guide](https://www.promptingguide.ai/techniques/fewshot)
- [OpenAI Few-shot Examples](https://platform.openai.com/docs/guides/prompt-engineering)

---

{/* TODO: 补充实际任务的 Few-shot 设计过程 */}
