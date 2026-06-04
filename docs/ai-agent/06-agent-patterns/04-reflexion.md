---
title: 反思型 Agent（Reflexion）
sidebar_position: 4
tags: [Agent, Reflexion, 反思, 自我改进]
---

# 反思型 Agent（Reflexion）

> 从错误中学习：通过反思提升表现

## 概述

Reflexion 模式让 Agent 在执行后反思结果，识别问题并改进。特别适合需要迭代优化的任务。

## 核心概念

### 1. 反思循环

```
执行任务
    ↓
评估结果
    ↓
    ├── 满意 → 完成
    │
    └── 不满意
           ↓
       反思原因
           ↓
       生成改进策略
           ↓
       重新执行 ─────────┘
```

### 2. 核心组件

| 组件 | 说明 |
|------|------|
| Actor | 执行任务的 Agent |
| Evaluator | 评估执行结果 |
| Reflector | 分析失败原因，提出改进 |
| Memory | 存储反思历史 |

### 3. 适用场景

- 代码生成（运行测试，修复错误）
- 写作任务（根据反馈修改）
- 搜索任务（优化搜索策略）
- 任何需要迭代优化的场景

## 实践要点

### 基础实现

{/* TODO: 补充完整的 Reflexion 实现 */}

```python
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

class Evaluation(BaseModel):
    score: int  # 1-10
    issues: list[str]
    passed: bool

class Reflection(BaseModel):
    what_went_wrong: str
    how_to_improve: str
    revised_approach: str

class ReflexionAgent:
    def __init__(self, llm):
        self.llm = llm
        self.reflections = []  # 反思记忆
    
    def execute(self, task: str) -> str:
        """执行任务"""
        context = self._build_context()
        prompt = f"""
        任务：{task}
        
        历史反思（避免重复错误）：
        {context}
        
        请执行任务：
        """
        return self.llm.invoke(prompt).content
    
    def evaluate(self, task: str, result: str) -> Evaluation:
        """评估结果"""
        prompt = f"""
        评估以下执行结果：
        
        任务：{task}
        结果：{result}
        
        评分（1-10），列出问题，判断是否通过。
        """
        return self.llm.with_structured_output(Evaluation).invoke(prompt)
    
    def reflect(self, task: str, result: str, evaluation: Evaluation) -> Reflection:
        """反思失败原因"""
        prompt = f"""
        任务执行失败，请反思：
        
        任务：{task}
        结果：{result}
        问题：{evaluation.issues}
        
        分析：什么出错了？如何改进？
        """
        reflection = self.llm.with_structured_output(Reflection).invoke(prompt)
        self.reflections.append(reflection)
        return reflection
    
    def run(self, task: str, max_attempts: int = 3) -> str:
        """带反思的执行"""
        for attempt in range(max_attempts):
            result = self.execute(task)
            evaluation = self.evaluate(task, result)
            
            if evaluation.passed:
                return result
            
            if attempt < max_attempts - 1:
                reflection = self.reflect(task, result, evaluation)
                print(f"反思 {attempt + 1}: {reflection.how_to_improve}")
        
        return result  # 返回最后一次结果
    
    def _build_context(self) -> str:
        if not self.reflections:
            return "无"
        return "\n".join([
            f"- {r.what_went_wrong}: {r.how_to_improve}" 
            for r in self.reflections[-3:]  # 只用最近 3 条
        ])
```

### 代码生成场景

```python
class CodeReflexionAgent(ReflexionAgent):
    def evaluate(self, task: str, code: str) -> Evaluation:
        """运行测试评估代码"""
        try:
            exec(code)
            # 运行测试...
            test_results = run_tests(code)
            
            if test_results.all_passed:
                return Evaluation(score=10, issues=[], passed=True)
            else:
                return Evaluation(
                    score=5,
                    issues=test_results.failures,
                    passed=False
                )
        except Exception as e:
            return Evaluation(
                score=1,
                issues=[str(e)],
                passed=False
            )
```

### LangGraph 实现

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class ReflexionState(TypedDict):
    task: str
    result: str
    evaluation: dict
    reflections: list
    attempt: int
    completed: bool

def actor(state: ReflexionState):
    """执行任务"""
    result = execute_task(state["task"], state["reflections"])
    return {"result": result, "attempt": state["attempt"] + 1}

def evaluator(state: ReflexionState):
    """评估结果"""
    evaluation = evaluate_result(state["task"], state["result"])
    return {"evaluation": evaluation, "completed": evaluation["passed"]}

def reflector(state: ReflexionState):
    """反思并改进"""
    reflection = generate_reflection(state["task"], state["result"], state["evaluation"])
    return {"reflections": state["reflections"] + [reflection]}

def should_continue(state: ReflexionState):
    if state["completed"]:
        return "end"
    if state["attempt"] >= 3:
        return "end"
    return "reflect"

# 构建图
workflow = StateGraph(ReflexionState)
workflow.add_node("actor", actor)
workflow.add_node("evaluator", evaluator)
workflow.add_node("reflector", reflector)

workflow.set_entry_point("actor")
workflow.add_edge("actor", "evaluator")
workflow.add_conditional_edges("evaluator", should_continue, {
    "reflect": "reflector",
    "end": END
})
workflow.add_edge("reflector", "actor")

app = workflow.compile()
```

## 常见问题

### Q: 反思会增加多少成本？

每次反思需要额外的 LLM 调用。建议：
- 设置最大重试次数
- 只在明确失败时反思
- 使用便宜模型做初步评估

### Q: 如何避免无效的反思？

- 确保评估标准明确
- 反思要具体，不要泛泛而谈
- 限制反思记忆长度，避免噪音

### Q: 和简单重试有什么区别？

简单重试每次执行独立；Reflexion 会积累经验，避免重复错误。

## 学习资源

- [Reflexion 论文](https://arxiv.org/abs/2303.11366)
- [LangGraph Reflexion Tutorial](https://langchain-ai.github.io/langgraph/tutorials/reflexion/)

---

{/* TODO: 补充实际任务的反思优化过程 */}
