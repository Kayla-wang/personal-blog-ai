---
title: 多 Agent（Supervisor / Worker）
sidebar_position: 2
tags: [Agent, 多Agent, Supervisor, Worker]
---

# 多 Agent（Supervisor / Worker）

> 分工协作：管理者分配任务，工人执行任务

## 概述

当任务复杂度超出单 Agent 能力时，可以使用多 Agent 架构。Supervisor 负责理解任务、分配工作，Workers 负责执行具体任务。

## 核心概念

### 1. 架构模式

```
            用户输入
               ↓
         ┌─────────────┐
         │  Supervisor │  ← 理解任务，决定分配
         └─────────────┘
          ↙    ↓    ↘
      ┌────┐ ┌────┐ ┌────┐
      │ W1 │ │ W2 │ │ W3 │  ← 专业工人
      └────┘ └────┘ └────┘
          ↘    ↓    ↙
         ┌─────────────┐
         │  Supervisor │  ← 整合结果
         └─────────────┘
               ↓
            最终输出
```

### 2. 角色分工

| 角色 | 职责 | 特点 |
|------|------|------|
| Supervisor | 任务分解、分配、整合 | 全局视角、决策能力 |
| Worker | 执行具体任务 | 专业技能、工具使用 |

### 3. 适用场景

- 任务需要多种专业能力
- 任务可以并行执行
- 需要明确的职责划分

## 实践要点

### LangGraph 实现

{/* TODO: 补充更复杂的多 Agent 示例 */}

```python
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import TypedDict, Literal, Annotated
import operator

# 状态定义
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    next: str

# Worker 定义
def create_worker(name: str, system_prompt: str):
    llm = ChatOpenAI(model="gpt-4o")
    
    def worker(state: AgentState):
        messages = [
            {"role": "system", "content": system_prompt},
            *state["messages"]
        ]
        response = llm.invoke(messages)
        return {"messages": [{"role": "assistant", "content": f"[{name}]: {response.content}"}]}
    
    return worker

# 创建专业 Workers
researcher = create_worker(
    "Researcher",
    "你是研究员，负责搜索和收集信息。"
)

coder = create_worker(
    "Coder",
    "你是程序员，负责编写代码。"
)

reviewer = create_worker(
    "Reviewer", 
    "你是审查员，负责检查工作质量。"
)

# Supervisor
def supervisor(state: AgentState):
    llm = ChatOpenAI(model="gpt-4o")
    
    system = """
    你是任务协调者。根据当前对话，决定下一步：
    - 如果需要搜索信息，回复 "researcher"
    - 如果需要写代码，回复 "coder"
    - 如果需要审查，回复 "reviewer"
    - 如果任务完成，回复 "FINISH"
    
    只回复角色名称，不要其他内容。
    """
    
    messages = [{"role": "system", "content": system}, *state["messages"]]
    response = llm.invoke(messages)
    
    next_agent = response.content.strip().lower()
    return {"next": next_agent}

# 路由函数
def route(state: AgentState) -> Literal["researcher", "coder", "reviewer", "end"]:
    if state["next"] == "finish":
        return "end"
    return state["next"]

# 构建图
workflow = StateGraph(AgentState)

workflow.add_node("supervisor", supervisor)
workflow.add_node("researcher", researcher)
workflow.add_node("coder", coder)
workflow.add_node("reviewer", reviewer)

workflow.set_entry_point("supervisor")

workflow.add_conditional_edges(
    "supervisor",
    route,
    {
        "researcher": "researcher",
        "coder": "coder",
        "reviewer": "reviewer",
        "end": END
    }
)

# Workers 完成后返回 Supervisor
workflow.add_edge("researcher", "supervisor")
workflow.add_edge("coder", "supervisor")
workflow.add_edge("reviewer", "supervisor")

app = workflow.compile()
```

### Worker 专业化

```python
# 每个 Worker 可以有自己的工具
from langchain_core.tools import tool

@tool
def search_web(query: str) -> str:
    """搜索网络"""
    return f"搜索结果: {query}"

@tool
def run_code(code: str) -> str:
    """执行代码"""
    # 安全执行...
    return "执行结果..."

# 研究员有搜索工具
researcher_agent = create_react_agent(llm, [search_web], prompt)

# 程序员有代码执行工具
coder_agent = create_react_agent(llm, [run_code], prompt)
```

### 并行执行

```python
from langgraph.graph import StateGraph
import asyncio

async def parallel_workers(state: AgentState):
    """并行执行多个 Worker"""
    tasks = [
        researcher(state),
        coder(state),
    ]
    results = await asyncio.gather(*tasks)
    
    combined_messages = []
    for result in results:
        combined_messages.extend(result["messages"])
    
    return {"messages": combined_messages}
```

## 常见问题

### Q: Supervisor 决策错误怎么办？

1. 改进 Supervisor 的 System Prompt
2. 提供更清晰的路由规则
3. 添加人工介入检查点

### Q: Workers 之间需要交流吗？

看场景：
- 独立任务：不需要，各自执行
- 协作任务：通过共享状态或 Supervisor 中转

### Q: 如何监控多 Agent 执行？

```python
# 添加日志
def supervisor_with_logging(state: AgentState):
    print(f"[Supervisor] 当前状态: {state['messages'][-1]}")
    result = supervisor(state)
    print(f"[Supervisor] 分配给: {result['next']}")
    return result
```

## 学习资源

- [LangGraph Multi-Agent](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/)
- [Multi-Agent 设计模式](https://www.anthropic.com/research/multi-agent)

---

{/* TODO: 补充生产级多 Agent 系统案例 */}
