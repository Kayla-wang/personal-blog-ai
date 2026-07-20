---
title: LangGraph（状态机 / 复杂流程）
sidebar_position: 2
tags: [Agent, LangGraph, 状态机]
---

# LangGraph

> 用状态机构建可控、可调试的 Agent

## 概述

LangGraph 是 LangChain 团队推出的 Agent 框架，基于图和状态机概念，让复杂 Agent 流程更可控、可观测。

## 核心概念

### 1. 为什么需要 LangGraph

```
传统 Agent 问题：
- 流程不可控（全靠 LLM 决定）
- 难以调试（黑盒执行）
- 错误处理困难

LangGraph 解决：
- 显式定义状态和转换
- 可视化流程图
- 人工介入点
- 错误恢复
```

### 2. 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| State | 全局状态对象 | 有状态的数据流 |
| Node | 处理节点 | 函数/步骤 |
| Edge | 节点间连接 | 流程控制 |
| Conditional Edge | 条件分支 | if-else |

### 3. 基本结构

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

# 1. 定义状态
class AgentState(TypedDict):
    messages: list
    next_action: str

# 2. 定义节点
def think(state: AgentState) -> AgentState:
    # 思考下一步
    return {"next_action": "search"}

def search(state: AgentState) -> AgentState:
    # 执行搜索
    return {"messages": state["messages"] + ["搜索结果..."]}

# 3. 构建图
graph = StateGraph(AgentState)
graph.add_node("think", think)
graph.add_node("search", search)
graph.add_edge("think", "search")
graph.add_edge("search", END)
graph.set_entry_point("think")

# 4. 编译运行
app = graph.compile()
result = app.invoke({"messages": [], "next_action": ""})
```

## 实践要点

### ReAct Agent 实现

{/* TODO: 补充完整的 ReAct Agent 示例 */}

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]  # 消息累加

# 工具节点
tools = [get_weather, calculate]
tool_node = ToolNode(tools)

# LLM
llm = ChatOpenAI(model="gpt-4o").bind_tools(tools)

# 决策节点
def agent(state: AgentState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# 路由函数
def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return "end"

# 构建图
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {"tools": "tools", "end": END}
)
workflow.add_edge("tools", "agent")  # 工具执行后返回 agent

app = workflow.compile()
```

### 人工介入（Human-in-the-Loop）

```python
from langgraph.checkpoint.memory import MemorySaver

# 添加检查点
memory = MemorySaver()
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["tools"]  # 在执行工具前暂停
)

# 运行到暂停点
config = {"configurable": {"thread_id": "1"}}
result = app.invoke({"messages": [("user", "删除所有文件")]}, config)

# 人工确认后继续
# app.invoke(None, config)  # 继续执行
# 或修改状态后继续
```

### 子图和模块化

```python
# 子图定义
def create_research_subgraph():
    subgraph = StateGraph(AgentState)
    subgraph.add_node("search", search_node)
    subgraph.add_node("summarize", summarize_node)
    # ...
    return subgraph.compile()

# 主图中使用子图
main_graph = StateGraph(AgentState)
main_graph.add_node("research", create_research_subgraph())
main_graph.add_node("write", write_node)
```

### 错误处理

```python
def safe_tool_call(state: AgentState):
    try:
        result = execute_tool(state)
        return {"messages": [result], "error": None}
    except Exception as e:
        return {"messages": [], "error": str(e)}

def handle_error(state: AgentState):
    if state.get("error"):
        return {"messages": [f"发生错误: {state['error']}"]}
    return state

# 添加错误处理边
workflow.add_conditional_edges(
    "tool",
    lambda s: "error" if s.get("error") else "continue",
    {"error": "handle_error", "continue": "agent"}
)
```

## 常见问题

### Q: LangGraph 和普通 LangChain Agent 区别？

| 方面 | LangChain Agent | LangGraph |
|------|-----------------|-----------|
| 控制流 | LLM 驱动 | 显式定义 |
| 可调试性 | 较难 | 容易（可视化） |
| 复杂流程 | 难以实现 | 原生支持 |
| 学习成本 | 低 | 中 |

### Q: 什么时候用 LangGraph？

- 需要复杂分支逻辑
- 需要人工介入
- 需要可靠的错误处理
- 需要状态持久化

### Q: 性能如何？

状态机开销很小，主要耗时仍在 LLM 调用。

## 学习资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangGraph 教程](https://github.com/langchain-ai/langgraph/tree/main/examples)

---

{/* TODO: 补充复杂多 Agent 协作示例 */}
