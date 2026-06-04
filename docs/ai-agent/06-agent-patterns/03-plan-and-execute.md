---
title: 规划型 Agent（Plan-and-Execute）
sidebar_position: 3
tags: [Agent, 规划, Plan-and-Execute]
---

# 规划型 Agent（Plan-and-Execute）

> 先规划后执行：提升复杂任务的成功率

## 概述

Plan-and-Execute 模式将任务分为两个阶段：先制定完整计划，再逐步执行。相比 ReAct 的边想边做，更适合复杂任务。

## 核心概念

### 1. 两阶段流程

```
用户输入
    ↓
┌─────────────────────────┐
│   Planning（规划阶段）    │
│   - 分析任务需求          │
│   - 分解为子任务          │
│   - 确定执行顺序          │
└─────────────────────────┘
    ↓
    计划清单
    ↓
┌─────────────────────────┐
│   Execution（执行阶段）   │
│   - 逐个执行子任务        │
│   - 记录执行结果          │
│   - 必要时调整计划        │
└─────────────────────────┘
    ↓
最终结果
```

### 2. 与 ReAct 对比

| 方面 | ReAct | Plan-and-Execute |
|------|-------|------------------|
| 决策时机 | 每步决策 | 先规划后执行 |
| 全局视角 | 弱 | 强 |
| 灵活性 | 高 | 中 |
| 适合任务 | 简单/探索性 | 复杂/多步骤 |

### 3. 适用场景

- 任务步骤多（>5 步）
- 步骤之间有依赖关系
- 需要资源/时间预估
- 允许执行中调整计划

## 实践要点

### 基础实现

{/* TODO: 补充完整的 Plan-and-Execute 实现 */}

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from typing import List

# 计划结构
class Step(BaseModel):
    step_number: int
    description: str
    tool_to_use: str | None
    depends_on: List[int]

class Plan(BaseModel):
    goal: str
    steps: List[Step]

# Planner
def create_planner(llm):
    prompt = ChatPromptTemplate.from_messages([
        ("system", """你是一个任务规划专家。
        
        给定用户目标，分解为具体步骤。每个步骤应该：
        1. 足够具体，可以单独执行
        2. 明确需要使用的工具（如果有）
        3. 标明依赖的前置步骤
        
        可用工具：search, calculator, write_file
        """),
        ("user", "{goal}")
    ])
    
    return prompt | llm.with_structured_output(Plan)

# Executor
async def execute_plan(plan: Plan, tools: dict) -> dict:
    results = {}
    
    for step in plan.steps:
        # 检查依赖
        for dep in step.depends_on:
            if dep not in results:
                raise Exception(f"步骤 {step.step_number} 依赖的步骤 {dep} 未完成")
        
        # 执行步骤
        if step.tool_to_use and step.tool_to_use in tools:
            result = await tools[step.tool_to_use].run(step.description)
        else:
            result = f"完成：{step.description}"
        
        results[step.step_number] = result
        print(f"✓ 步骤 {step.step_number}: {step.description}")
    
    return results

# 使用
llm = ChatOpenAI(model="gpt-4o")
planner = create_planner(llm)

plan = planner.invoke({"goal": "研究 AI Agent 并写一篇总结文章"})
print(plan)

results = await execute_plan(plan, tools)
```

### 动态重规划

```python
class PlanExecutor:
    def __init__(self, planner, tools, llm):
        self.planner = planner
        self.tools = tools
        self.llm = llm
    
    async def execute_with_replan(self, goal: str):
        plan = self.planner.invoke({"goal": goal})
        completed = []
        
        for step in plan.steps:
            try:
                result = await self._execute_step(step)
                completed.append((step, result))
            except Exception as e:
                # 执行失败，重新规划
                new_goal = self._create_recovery_goal(goal, completed, step, e)
                plan = self.planner.invoke({"goal": new_goal})
                # 继续执行新计划...
        
        return completed
    
    def _create_recovery_goal(self, original_goal, completed, failed_step, error):
        return f"""
        原目标: {original_goal}
        已完成: {completed}
        失败步骤: {failed_step}
        错误: {error}
        
        请重新规划剩余步骤。
        """
```

### LangGraph 实现

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class PlanExecuteState(TypedDict):
    goal: str
    plan: list
    current_step: int
    results: dict
    completed: bool

def planner(state: PlanExecuteState):
    """生成计划"""
    plan = create_plan(state["goal"])
    return {"plan": plan, "current_step": 0}

def executor(state: PlanExecuteState):
    """执行当前步骤"""
    step = state["plan"][state["current_step"]]
    result = execute_step(step)
    
    new_results = state["results"].copy()
    new_results[state["current_step"]] = result
    
    return {
        "results": new_results,
        "current_step": state["current_step"] + 1
    }

def should_continue(state: PlanExecuteState):
    if state["current_step"] >= len(state["plan"]):
        return "end"
    return "execute"

# 构建图
workflow = StateGraph(PlanExecuteState)
workflow.add_node("plan", planner)
workflow.add_node("execute", executor)

workflow.set_entry_point("plan")
workflow.add_edge("plan", "execute")
workflow.add_conditional_edges("execute", should_continue, {"execute": "execute", "end": END})

app = workflow.compile()
```

## 常见问题

### Q: 计划粒度怎么定？

- 太粗：执行时还需要再分解
- 太细：计划本身成本高
- 建议：每步 1-2 个工具调用

### Q: 什么时候需要重规划？

- 步骤执行失败
- 发现新信息改变了前提
- 用户中途修改需求

### Q: Plan-and-Execute 更慢吗？

规划阶段有额外开销，但对于复杂任务，整体成功率更高，总时间可能更短。

## 学习资源

- [Plan-and-Solve 论文](https://arxiv.org/abs/2305.04091)
- [LangGraph Plan-and-Execute](https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/)

---

{/* TODO: 补充复杂任务的规划执行案例 */}
