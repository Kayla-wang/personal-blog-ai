---
title: 单 Agent（ReAct）
sidebar_position: 1
tags: [Agent, ReAct, 设计模式]
---

# 单 Agent（ReAct）

> 最基础的 Agent 模式：思考 → 行动 → 观察

## 概述

单 Agent 是最简单也最常用的模式。一个 Agent 独立完成任务，通过 ReAct 循环（Reasoning + Acting）与工具交互。

## 核心概念

### 1. ReAct 循环

```
用户输入
    ↓
┌─→ Thought（思考）: 我需要做什么？
│       ↓
│   Action（行动）: 调用工具
│       ↓
│   Observation（观察）: 工具返回结果
│       ↓
│   判断：任务完成？
│       ├── 否 → 继续循环 ─┘
│       └── 是 → 输出最终答案
```

### 2. 关键组件

| 组件 | 说明 |
|------|------|
| LLM | 思考和决策的大脑 |
| Tools | 扩展能力的工具集 |
| Prompt | 定义行为的指令 |
| Memory | 可选的对话记忆 |

### 3. 适用场景

- 任务相对简单、明确
- 工具数量有限（少于 10 个）
- 不需要复杂的分工协作

## 实践要点

### 基础实现

{/* TODO: 补充更多实际案例 */}

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent, AgentExecutor
from langchain_core.tools import tool
from langchain import hub

# 定义工具
@tool
def search(query: str) -> str:
    """搜索互联网获取信息"""
    # 实际实现...
    return f"搜索结果：关于 {query} 的信息..."

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

tools = [search, calculator]

# 创建 Agent
llm = ChatOpenAI(model="gpt-4o", temperature=0)
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5,
    handle_parsing_errors=True
)

# 运行
result = agent_executor.invoke({
    "input": "搜索一下今天的 AI 新闻，然后计算 2024 + 100"
})
```

### 工具设计原则

```python
# ✅ 好的工具设计
@tool
def get_weather(city: str) -> str:
    """
    获取指定城市的天气信息。
    
    参数：
        city: 城市名称，如 "北京"、"上海"
    
    返回：
        天气描述，包含温度、天气状况等
    """
    # 实现...

# ❌ 不好的工具设计
@tool
def weather(c: str) -> str:
    """获取天气"""  # 描述太简单
    # 实现...
```

### 错误处理

```python
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    handle_parsing_errors=True,  # 处理解析错误
    max_iterations=10,           # 限制最大迭代
    max_execution_time=60,       # 超时限制（秒）
    early_stopping_method="generate"  # 超限时生成最终答案
)
```

### 带记忆的 Agent

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# 多轮对话
agent_executor.invoke({"input": "我叫小明"})
agent_executor.invoke({"input": "我叫什么名字？"})  # 能记住
```

### 流式输出

```python
async def stream_agent():
    async for event in agent_executor.astream_events(
        {"input": "搜索 AI 新闻"},
        version="v1"
    ):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content
            if content:
                print(content, end="", flush=True)
```

## 常见问题

### Q: Agent 陷入死循环怎么办？

1. 设置 `max_iterations` 限制
2. 检查工具是否返回了有用信息
3. 优化 Prompt，明确停止条件

### Q: Agent 选错工具怎么办？

1. 改进工具描述，更清晰具体
2. 减少相似功能的工具
3. 在 Prompt 中给出选择示例

### Q: 如何评估单 Agent 效果？

```python
test_cases = [
    {"input": "北京天气", "expected_tool": "get_weather"},
    {"input": "1+1等于几", "expected_tool": "calculator"},
]

for case in test_cases:
    result = agent_executor.invoke({"input": case["input"]})
    # 检查是否调用了正确的工具
    # 检查最终答案是否正确
```

## 学习资源

- [ReAct 论文](https://arxiv.org/abs/2210.03629)
- [LangChain Agents 文档](https://python.langchain.com/docs/modules/agents)

---

{/* TODO: 补充实际项目的单 Agent 实现 */}
