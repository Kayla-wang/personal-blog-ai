---
title: Chain-of-Thought（思维链）
sidebar_position: 3
tags: [Prompt, CoT, 思维链, 推理]
---

# Chain-of-Thought（思维链）

> 让模型展示推理过程，提升复杂任务准确率

## 概述

Chain-of-Thought (CoT) 是一种让模型"先思考再回答"的技术。对于需要推理的任务，CoT 能显著提升准确率。

## 核心概念

### 1. 基本原理

```
普通 Prompt：
问：小明有 5 个苹果，给了小红 2 个，又买了 3 个，现在有几个？
答：6 个  ❌（可能出错）

CoT Prompt：
问：小明有 5 个苹果，给了小红 2 个，又买了 3 个，现在有几个？
让我们一步步思考：
1. 小明开始有 5 个苹果
2. 给了小红 2 个，剩下 5 - 2 = 3 个
3. 又买了 3 个，现在有 3 + 3 = 6 个
答：6 个  ✅（推理过程清晰）
```

### 2. 触发方式

```python
# 方式 1：简单触发
prompt = f"{question}\n\n让我们一步步思考："

# 方式 2：Few-shot CoT
prompt = """
问：...
让我们一步步思考：
1. 首先...
2. 然后...
3. 因此...
答：...

问：{question}
让我们一步步思考：
"""

# 方式 3：结构化 CoT
prompt = """
请按以下步骤分析问题：
1. 理解问题
2. 识别关键信息
3. 制定解决方案
4. 执行计算
5. 验证结果

问题：{question}
"""
```

### 3. 适用场景

| 任务类型 | 是否需要 CoT | 说明 |
|----------|--------------|------|
| 数学计算 | ✅ 需要 | 多步计算易出错 |
| 逻辑推理 | ✅ 需要 | 需要分析因果 |
| 代码调试 | ✅ 需要 | 需要分析流程 |
| 简单分类 | ❌ 不需要 | 直接输出即可 |
| 信息提取 | ❌ 不需要 | 过程简单 |

## 实践要点

### Agent 开发中的 CoT

{/* TODO: 补充实际 Agent 的 CoT 实现 */}

```python
# Agent 规划任务时使用 CoT
PLANNING_PROMPT = """
用户请求：{request}

请按以下步骤分析并制定计划：

1. 理解任务
   - 用户真正想要什么？
   - 有什么约束条件？

2. 分解子任务
   - 需要完成哪些步骤？
   - 步骤之间的依赖关系？

3. 选择工具
   - 每个步骤需要什么工具？
   - 工具的输入输出是什么？

4. 制定计划
   基于以上分析，输出执行计划：
   
   步骤 1: ...
   步骤 2: ...
"""
```

### Zero-shot CoT

最简单的 CoT，只需加一句话：

```python
prompt = f"""
{question}

Let's think step by step.
"""
# 或中文版
prompt = f"""
{question}

让我们一步步思考。
"""
```

### 自我一致性（Self-Consistency）

多次 CoT + 投票，提升可靠性：

```python
async def self_consistency(question: str, n: int = 5) -> str:
    """多次推理，取众数"""
    answers = []
    
    for _ in range(n):
        response = await call_llm(
            f"{question}\n\n让我们一步步思考：",
            temperature=0.7  # 需要一些随机性
        )
        answer = extract_final_answer(response)
        answers.append(answer)
    
    # 返回出现最多的答案
    return max(set(answers), key=answers.count)
```

## 常见问题

### Q: CoT 会增加延迟吗？

会，因为输出更长。权衡：
- 简单任务：不用 CoT，省时间
- 复杂任务：用 CoT，保准确率

### Q: 模型不按 CoT 格式输出怎么办？

1. 用 Few-shot 示例强化格式
2. 使用结构化输出（JSON Schema）
3. 在 System Prompt 中强调格式要求

### Q: CoT 对所有模型都有效吗？

主要对大模型有效（GPT-4、Claude）。小模型可能：
- 无法生成有意义的推理
- 推理过程本身出错

## 学习资源

- [Chain-of-Thought Prompting 论文](https://arxiv.org/abs/2201.11903)
- [Prompt Engineering Guide - CoT](https://www.promptingguide.ai/techniques/cot)

---

{/* TODO: 补充复杂推理任务的 CoT 实践 */}
